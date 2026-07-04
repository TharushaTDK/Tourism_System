import bcrypt from 'bcryptjs';
import pool from './database';

const migrate = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        phone VARCHAR(30),
        nationality VARCHAR(100),
        profile_image VARCHAR(500),
        role VARCHAR(20) DEFAULT 'tourist' CHECK (role IN ('tourist','driver','admin','partner')),
        is_verified BOOLEAN DEFAULT false,
        google_id VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS destinations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        category VARCHAR(50) CHECK (category IN ('cultural','beach','wildlife','hill_country','adventure')),
        country VARCHAR(100) DEFAULT 'Sri Lanka',
        province VARCHAR(100),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        image_urls TEXT[],
        video_url VARCHAR(500),
        best_time_to_visit VARCHAR(200),
        entry_fee DECIMAL(10,2) DEFAULT 0,
        opening_hours VARCHAR(200),
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) DEFAULT '📍';`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS budget_price DECIMAL(10,2) DEFAULT 0;`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS mid_range_price DECIMAL(10,2) DEFAULT 0;`);
    await client.query(`ALTER TABLE destinations ADD COLUMN IF NOT EXISTS luxury_price DECIMAL(10,2) DEFAULT 0;`);

    // Per-km transport rates, tiered by budget category and passenger count (admin-editable)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transport_rates (
        id SERIAL PRIMARY KEY,
        category VARCHAR(20) NOT NULL CHECK (category IN ('budget','mid_range','luxury')),
        vehicle_type VARCHAR(50) NOT NULL,
        min_passengers INT NOT NULL DEFAULT 1,
        max_passengers INT NOT NULL,
        price_per_km DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Per-day accommodation & food rates by budget category (admin-editable)
    await client.query(`
      CREATE TABLE IF NOT EXISTS cost_settings (
        id SERIAL PRIMARY KEY,
        category VARCHAR(20) UNIQUE NOT NULL CHECK (category IN ('budget','mid_range','luxury')),
        accommodation_per_night DECIMAL(10,2) NOT NULL DEFAULT 0,
        food_per_day DECIMAL(10,2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attractions (
        id SERIAL PRIMARY KEY,
        destination_id INT REFERENCES destinations(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        distance_km DECIMAL(6,2),
        travel_time_minutes INT,
        is_free BOOLEAN DEFAULT true,
        entry_fee DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(50) CHECK (category IN ('safari','train','hiking','adventure','cultural','wellness')),
        location VARCHAR(200),
        destination_id INT REFERENCES destinations(id) ON DELETE SET NULL,
        duration_hours DECIMAL(5,2),
        difficulty VARCHAR(20) DEFAULT 'moderate' CHECK (difficulty IN ('easy','moderate','hard')),
        min_group INT DEFAULT 1,
        max_group INT DEFAULT 20,
        price_per_person DECIMAL(10,2) NOT NULL,
        image_urls TEXT[],
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        provider_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(20) CHECK (category IN ('budget','mid_range','luxury')),
        type VARCHAR(20) CHECK (type IN ('hotel','villa','resort','homestay')),
        destination_id INT REFERENCES destinations(id) ON DELETE SET NULL,
        address VARCHAR(300),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        price_per_night DECIMAL(10,2) NOT NULL,
        amenities TEXT[],
        image_urls TEXT[],
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INT DEFAULT 0,
        star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        partner_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        driver_id INT REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) CHECK (type IN ('sedan','suv','van','luxury')),
        make VARCHAR(100),
        model VARCHAR(100),
        year INT,
        plate_number VARCHAR(30) UNIQUE,
        capacity INT,
        ac BOOLEAN DEFAULT true,
        image_url VARCHAR(500),
        is_available BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tour_packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(20) CHECK (category IN ('budget','family','honeymoon','adventure','luxury','wildlife')),
        duration_days INT NOT NULL,
        price_per_person DECIMAL(10,2) NOT NULL,
        max_group INT DEFAULT 20,
        inclusions TEXT[],
        exclusions TEXT[],
        image_urls TEXT[],
        itinerary_overview JSONB,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS itineraries (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        start_date DATE,
        end_date DATE,
        total_days INT,
        total_budget DECIMAL(10,2),
        estimated_cost DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','planned','active','completed')),
        notes TEXT,
        ai_generated BOOLEAN DEFAULT false,
        share_token VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`ALTER TABLE itineraries DROP CONSTRAINT IF EXISTS itineraries_status_check;`);
    await client.query(`ALTER TABLE itineraries ADD CONSTRAINT itineraries_status_check CHECK (status IN ('draft','planned','active','completed','pending_approval','approved'));`);
    await client.query(`ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);`);
    await client.query(`ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30);`);
    await client.query(`ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS contact_whatsapp VARCHAR(30);`);
    await client.query(`ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS trip_details JSONB;`);
    await client.query(`ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS itinerary_items (
        id SERIAL PRIMARY KEY,
        itinerary_id INT REFERENCES itineraries(id) ON DELETE CASCADE,
        day_number INT NOT NULL,
        order_number INT NOT NULL DEFAULT 1,
        type VARCHAR(20) CHECK (type IN ('destination','activity','hotel','transport','meal')),
        reference_id INT,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_time TIME,
        end_time TIME,
        cost DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        booking_type VARCHAR(20) CHECK (booking_type IN ('hotel','activity','transport','package')),
        reference_id INT NOT NULL,
        itinerary_id INT REFERENCES itineraries(id) ON DELETE SET NULL,
        check_in DATE,
        check_out DATE,
        guests INT DEFAULT 1,
        amount DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
        special_requests TEXT,
        payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_method VARCHAR(20) CHECK (payment_method IN ('card','paypal','bank')),
        transaction_id VARCHAR(255) UNIQUE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
        payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        booking_id INT REFERENCES bookings(id) ON DELETE SET NULL,
        driver_id INT REFERENCES users(id) ON DELETE SET NULL,
        tourist_id INT REFERENCES users(id) ON DELETE SET NULL,
        vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,
        origin VARCHAR(200) NOT NULL,
        destination VARCHAR(200) NOT NULL,
        pickup_date DATE NOT NULL,
        pickup_time TIME,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
        total_km DECIMAL(8,2),
        fare DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trip_tracking (
        id SERIAL PRIMARY KEY,
        trip_id INT REFERENCES trips(id) ON DELETE CASCADE,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        speed DECIMAL(6,2),
        heading DECIMAL(6,2),
        recorded_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        reviewable_type VARCHAR(20) CHECK (reviewable_type IN ('destination','activity','hotel','driver','package')),
        reviewable_id INT NOT NULL,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        title VARCHAR(200),
        comment TEXT,
        images TEXT[],
        is_verified BOOLEAN DEFAULT false,
        helpful_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, reviewable_type, reviewable_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        location VARCHAR(200),
        destination_id INT REFERENCES destinations(id) ON DELETE SET NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        category VARCHAR(20) CHECK (category IN ('festival','cultural','sports','nature')),
        image_url VARCHAR(500),
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        slug VARCHAR(300) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt VARCHAR(500),
        category VARCHAR(20) CHECK (category IN ('visa','culture','tips','currency','safety','food')),
        author_id INT REFERENCES users(id) ON DELETE SET NULL,
        image_url VARCHAR(500),
        tags TEXT[],
        published BOOLEAN DEFAULT false,
        view_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) CHECK (type IN ('booking','weather','event','recommendation','system')),
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT false,
        sent_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) CHECK (type IN ('police','hospital','embassy','driver','operator')),
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        address VARCHAR(300),
        city VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_recommendations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        destination_id INT REFERENCES destinations(id) ON DELETE SET NULL,
        recommendation_type VARCHAR(20) CHECK (recommendation_type IN ('attraction','route','activity','package')),
        data JSONB,
        score DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_destinations_slug ON destinations(slug);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_destinations_featured ON destinations(is_featured);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_destination ON activities(destination_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hotels_destination ON hotels(destination_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_hotels_category ON hotels(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_trips_tourist ON trips(tourist_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_reviewable ON reviews(reviewable_type, reviewable_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary ON itinerary_items(itinerary_id);`);

    // Seed emergency contacts
    await client.query(`
      INSERT INTO emergency_contacts (type, name, phone, address, city) VALUES
        ('police', 'Tourist Police', '+94 11 242 1052', 'Bambalapitiya', 'Colombo'),
        ('hospital', 'National Hospital of Sri Lanka', '+94 11 269 1111', 'Regent Street', 'Colombo'),
        ('embassy', 'US Embassy Colombo', '+94 11 249 8500', '210 Galle Road', 'Colombo'),
        ('operator', 'Sri Lanka Tourism Hotline', '1912', NULL, 'Nationwide'),
        ('operator', 'SriLankan Airlines', '+94 11 777 1979', 'Bandaranaike International Airport', 'Katunayake')
      ON CONFLICT DO NOTHING;
    `);

    // Seed destinations
    await client.query(`
      INSERT INTO destinations (name, slug, description, short_description, category, province, latitude, longitude, best_time_to_visit, entry_fee, rating, review_count, is_featured, image_urls, emoji) VALUES
        ('Colombo', 'colombo', 'Sri Lanka''s vibrant commercial capital blends colonial architecture with modern skyscrapers, bustling markets, and world-class restaurants. Explore the Dutch Fort, Galle Face Green, and Pettah market.', 'Sri Lanka''s vibrant commercial capital with colonial heritage.', 'cultural', 'Western', 6.9271, 79.8612, 'Year-round', 0, 4.3, 120, true, ARRAY['https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800'], '🏙️'),
        ('Sigiriya', 'sigiriya', 'Sigiriya, the 5th-century Lion Rock fortress, is Sri Lanka''s most iconic landmark. Climb 1,200 steps to a palace perched 200m above the jungle, featuring ancient frescoes and water gardens.', 'Ancient Lion Rock fortress rising 200m above jungle.', 'cultural', 'Central', 7.9570, 80.7603, 'January to April', 30, 4.8, 340, true, ARRAY['https://images.unsplash.com/photo-1586273963694-a5b1c0e0b2f9?w=800'], '🏰'),
        ('Kandy', 'kandy', 'The cultural capital of Sri Lanka, Kandy is home to the sacred Temple of the Tooth Relic, Kandy Lake, the Royal Botanical Gardens, and vibrant Kandyan dance performances.', 'Cultural capital hosting the sacred Temple of the Tooth.', 'cultural', 'Central', 7.2906, 80.6337, 'January to April, July to August', 15, 4.6, 280, true, ARRAY['https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=800'], '🛕'),
        ('Ella', 'ella', 'A charming hill-country village surrounded by tea plantations, waterfalls, and misty mountains. Famous for the Nine Arch Bridge, Little Adam''s Peak, and Ella Rock hike.', 'Charming hill village with tea estates and Nine Arch Bridge.', 'hill_country', 'Uva', 6.8667, 81.0465, 'Year-round (avoid heavy monsoon)', 0, 4.7, 310, true, ARRAY['https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800'], '🏔️'),
        ('Yala National Park', 'yala-national-park', 'Sri Lanka''s most visited wildlife sanctuary, Yala boasts one of the highest leopard densities in the world. Safari drives offer sightings of elephants, bears, crocodiles, and hundreds of bird species.', 'World-famous wildlife park with highest leopard density.', 'wildlife', 'Southern', 6.3728, 81.5198, 'February to July', 25, 4.7, 290, true, ARRAY['https://images.unsplash.com/photo-1612698093158-e07ac200d44e?w=800'], '🦁'),
        ('Mirissa', 'mirissa', 'A laid-back coastal gem on the southern coast, Mirissa is renowned for whale watching (blue and sperm whales), golden beaches, coconut trees, and vibrant nightlife.', 'Idyllic southern beach famous for whale watching.', 'beach', 'Southern', 5.9483, 80.4574, 'November to April', 0, 4.5, 220, true, ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'], '🐋'),
        ('Dambulla Cave Temple', 'dambulla-cave-temple', 'The largest and best-preserved cave temple complex in Sri Lanka, a UNESCO World Heritage Site containing over 150 Buddha statues and 80 caves with ancient murals dating back 2,000 years.', 'UNESCO cave temple complex with 150+ Buddha statues.', 'cultural', 'Central', 7.8567, 80.6482, 'Year-round', 15, 4.6, 195, false, ARRAY['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'], '🕍'),
        ('Nuwara Eliya', 'nuwara-eliya', 'Known as "Little England", Nuwara Eliya sits at 1,868m altitude surrounded by verdant tea estates. Colonial bungalows, a race course, and cool climate make it unique among Sri Lankan destinations.', 'Colonial hill station amid lush tea plantations at 1,868m.', 'hill_country', 'Central', 6.9497, 80.7891, 'March to May, August to September', 0, 4.4, 175, false, ARRAY['https://images.unsplash.com/photo-1585136917228-45649f79f1be?w=800'], '🍵'),
        ('Arugam Bay', 'arugam-bay', 'A world-renowned surf town on the east coast, Arugam Bay draws wave-chasers with its legendary point break, laid-back beach shacks, and nearby lagoons rich in birdlife and elephants.', 'Legendary east-coast surf town with a laid-back vibe.', 'beach', 'Eastern', 6.8402, 81.8358, 'April to October', 0, 4.6, 160, true, ARRAY['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800'], '🏄')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Backfill emoji for destinations seeded before the emoji column existed
    await client.query(`
      UPDATE destinations SET emoji = v.emoji FROM (VALUES
        ('colombo', '🏙️'), ('sigiriya', '🏰'), ('kandy', '🛕'), ('ella', '🏔️'),
        ('yala-national-park', '🦁'), ('mirissa', '🐋'), ('dambulla-cave-temple', '🕍'),
        ('nuwara-eliya', '🍵'), ('arugam-bay', '🏄')
      ) AS v(slug, emoji)
      WHERE destinations.slug = v.slug AND (destinations.emoji IS NULL OR destinations.emoji = '📍');
    `);

    // Sample per-destination activity/entry cost by budget tier (per traveler), admin-editable
    await client.query(`
      UPDATE destinations SET budget_price = v.budget_price, mid_range_price = v.mid_range_price, luxury_price = v.luxury_price FROM (VALUES
        ('colombo', 10, 20, 40),
        ('sigiriya', 30, 45, 70),
        ('kandy', 15, 25, 45),
        ('ella', 10, 20, 35),
        ('yala-national-park', 40, 65, 110),
        ('mirissa', 15, 30, 55),
        ('dambulla-cave-temple', 15, 25, 40),
        ('nuwara-eliya', 10, 20, 35),
        ('arugam-bay', 15, 25, 45)
      ) AS v(slug, budget_price, mid_range_price, luxury_price)
      WHERE destinations.slug = v.slug AND destinations.budget_price = 0;
    `);

    // Seed transport rates: price per km, tiered by budget category and passenger count
    await client.query(`
      INSERT INTO transport_rates (category, vehicle_type, min_passengers, max_passengers, price_per_km)
      SELECT * FROM (VALUES
        ('budget', 'Sedan', 1, 3, 0.25),
        ('budget', 'Van', 4, 6, 0.35),
        ('budget', 'Mini Coach', 7, 15, 0.55),
        ('mid_range', 'AC Sedan', 1, 3, 0.40),
        ('mid_range', 'AC Van', 4, 6, 0.55),
        ('mid_range', 'AC Mini Coach', 7, 15, 0.80),
        ('luxury', 'Luxury Car', 1, 3, 0.70),
        ('luxury', 'Luxury Van', 4, 6, 0.95),
        ('luxury', 'Luxury Coach', 7, 15, 1.30)
      ) AS v(category, vehicle_type, min_passengers, max_passengers, price_per_km)
      WHERE NOT EXISTS (SELECT 1 FROM transport_rates);
    `);

    // Seed cost settings: accommodation + food per day, by budget category
    await client.query(`
      INSERT INTO cost_settings (category, accommodation_per_night, food_per_day) VALUES
        ('budget', 25, 15),
        ('mid_range', 60, 30),
        ('luxury', 150, 60)
      ON CONFLICT (category) DO NOTHING;
    `);

    // Seed admin account
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    await client.query(
      `INSERT INTO users (name, email, password, role, is_verified) VALUES ($1,$2,$3,'admin',true) ON CONFLICT (email) DO NOTHING`,
      ['Admin', 'admin@gmail.com', adminPasswordHash]
    );

    // Seed activities
    await client.query(`
      INSERT INTO activities (name, slug, description, category, location, duration_hours, difficulty, min_group, max_group, price_per_person, rating, review_count, is_featured, image_urls) VALUES
        ('Yala Leopard Safari', 'yala-leopard-safari', 'Embark on a thrilling 4WD safari through Yala National Park, the best place in the world to spot wild leopards. Your expert naturalist guide will navigate the terrain at dawn for optimal wildlife sightings.', 'safari', 'Yala National Park, Southern Province', 4, 'easy', 2, 8, 65, 4.8, 145, true, ARRAY['https://images.unsplash.com/photo-1612698093158-e07ac200d44e?w=800']),
        ('Kandy to Ella Scenic Train', 'kandy-ella-scenic-train', 'Widely regarded as one of the world''s most beautiful train journeys, this 5-hour ride winds through misty mountains, tea plantations, and dramatic valleys between Kandy and Ella.', 'train', 'Kandy to Ella', 5, 'easy', 1, 50, 12, 4.9, 380, true, ARRAY['https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800']),
        ('Little Adam''s Peak Hike', 'little-adams-peak-hike', 'A beginner-friendly 2-hour hike through tea estates to the summit of Little Adam''s Peak near Ella, offering breathtaking 360° views of the surrounding hills and valleys.', 'hiking', 'Ella, Uva Province', 2, 'easy', 1, 15, 18, 4.7, 210, true, ARRAY['https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800']),
        ('Kandyan Cultural Dance Show', 'kandyan-cultural-dance-show', 'Experience the vibrant traditional Kandyan dance performance featuring fire walkers, acrobats, and elaborately costumed dancers at the historic Kandy Cultural Centre each evening.', 'cultural', 'Kandy Cultural Centre, Kandy', 1.5, 'easy', 1, 200, 15, 4.5, 165, false, ARRAY['https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=800']),
        ('Sigiriya Rock Fortress Climb', 'sigiriya-rock-fortress-climb', 'Conquer the iconic 200-metre Lion Rock, climbing ancient staircases past 5th-century frescoes and the famous lion paw gate to reach the spectacular palace ruins at the summit.', 'adventure', 'Sigiriya, Central Province', 3, 'moderate', 1, 20, 35, 4.8, 290, true, ARRAY['https://images.unsplash.com/photo-1586273963694-a5b1c0e0b2f9?w=800']),
        ('White Water Rafting Kitulgala', 'white-water-rafting-kitulgala', 'Paddle through Grade 2–4 rapids on the Kelani River near Kitulgala, the filming location of Bridge on the River Kwai. Suitable for beginners and experienced rafters alike.', 'adventure', 'Kitulgala, Sabaragamuwa Province', 2.5, 'moderate', 4, 12, 45, 4.6, 130, false, ARRAY['https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800'])
      ON CONFLICT (slug) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(console.error);
