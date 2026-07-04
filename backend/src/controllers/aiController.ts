import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const generateItinerary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { arrival, departure, travelers, budget, interests, selected_destinations } = req.body;
  try {
    let destinationInfo = '';
    if (selected_destinations?.length) {
      const result = await pool.query(
        'SELECT name, description, category, best_time_to_visit, entry_fee FROM destinations WHERE id = ANY($1)',
        [selected_destinations]
      );
      destinationInfo = result.rows.map((d) => `- ${d.name} (${d.category}): ${d.description.substring(0, 150)}...`).join('\n');
    }

    const days = Math.ceil((new Date(departure).getTime() - new Date(arrival).getTime()) / 86400000);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Create a detailed day-by-day Sri Lanka travel itinerary.

Trip Details:
- Arrival: ${arrival}, Departure: ${departure} (${days} days)
- Travelers: ${travelers}
- Budget Level: ${budget}
- Interests: ${interests?.join(', ') || 'general tourism'}
- Selected Destinations:
${destinationInfo || 'Open to suggestions'}

Return a JSON object with this structure:
{
  "title": "Trip title",
  "summary": "Brief overview",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day title",
      "destinations": ["Place 1"],
      "activities": [
        { "time": "09:00", "activity": "Activity name", "duration": "2h", "cost": 50, "notes": "tip" }
      ],
      "accommodation": "Hotel suggestion",
      "meals": ["Breakfast place", "Lunch place", "Dinner place"],
      "estimated_cost": 150,
      "tips": "Pro tip for the day"
    }
  ],
  "cost_breakdown": {
    "transport": 500,
    "hotels": 600,
    "activities": 300,
    "food": 200,
    "total": 1600
  },
  "packing_tips": ["item1", "item2"],
  "best_time": "Month range"
}`
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') { res.status(500).json({ success: false, message: 'AI generation failed' }); return; }

    let itinerary;
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      itinerary = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content.text);
    } catch {
      itinerary = { raw: content.text };
    }

    if (req.user?.id) {
      await pool.query(
        'INSERT INTO ai_recommendations (user_id, recommendation_type, data) VALUES ($1, $2, $3)',
        [req.user.id, 'route', JSON.stringify(itinerary)]
      );
    }

    res.json({ success: true, message: 'Itinerary generated', data: itinerary });
  } catch (err) {
    console.error('AI generateItinerary:', err);
    res.status(500).json({ success: false, message: 'AI service error' });
  }
};

export const optimizeRoute = async (req: Request, res: Response): Promise<void> => {
  const { destination_ids } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, name, latitude, longitude FROM destinations WHERE id = ANY($1)',
      [destination_ids]
    );
    const destinations = result.rows;
    if (destinations.length < 2) {
      res.json({ success: true, message: 'Route (too few points)', data: destinations });
      return;
    }

    // Nearest neighbor algorithm
    const remaining = [...destinations];
    const ordered = [remaining.shift()!];
    while (remaining.length > 0) {
      const last = ordered[ordered.length - 1];
      let nearest = 0;
      let minDist = Infinity;
      remaining.forEach((d, i) => {
        const dist = Math.sqrt(Math.pow(d.latitude - last.latitude, 2) + Math.pow(d.longitude - last.longitude, 2));
        if (dist < minDist) { minDist = dist; nearest = i; }
      });
      ordered.push(remaining.splice(nearest, 1)[0]);
    }

    const totalDistKm = ordered.reduce((acc, d, i) => {
      if (i === 0) return acc;
      const prev = ordered[i - 1];
      const dist = Math.sqrt(Math.pow((d.latitude - prev.latitude) * 111, 2) + Math.pow((d.longitude - prev.longitude) * 111, 2));
      return acc + dist;
    }, 0);

    res.json({ success: true, message: 'Route optimized', data: { ordered_destinations: ordered, total_distance_km: Math.round(totalDistKm) } });
  } catch (err) {
    console.error('optimizeRoute:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const estimateCost = async (req: Request, res: Response): Promise<void> => {
  const { destinations = [], days = 7, travelers = 2, budget_level = 'mid_range' } = req.body;

  const rates: Record<string, { hotel: number; food: number; transport_per_day: number }> = {
    budget: { hotel: 25, food: 15, transport_per_day: 20 },
    mid_range: { hotel: 80, food: 35, transport_per_day: 50 },
    luxury: { hotel: 250, food: 100, transport_per_day: 120 },
  };

  const rate = rates[budget_level] || rates.mid_range;

  try {
    let activitiesCost = 0;
    if (destinations.length > 0) {
      const acts = await pool.query(
        'SELECT AVG(price_per_person) as avg FROM activities WHERE destination_id = ANY($1) AND is_active=true',
        [destinations]
      );
      activitiesCost = (Number(acts.rows[0].avg) || 45) * travelers * Math.ceil(days / 2);
    } else {
      activitiesCost = 45 * travelers * Math.ceil(days / 2);
    }

    const estimate = {
      transport: rate.transport_per_day * days,
      hotels: rate.hotel * days * Math.ceil(travelers / 2),
      activities: Math.round(activitiesCost),
      food: rate.food * days * travelers,
      total: 0,
    };
    estimate.total = estimate.transport + estimate.hotels + estimate.activities + estimate.food;

    res.json({ success: true, message: 'Cost estimated', data: estimate });
  } catch (err) {
    console.error('estimateCost:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getChatResponse = async (req: Request, res: Response): Promise<void> => {
  const { message, session_id, context } = req.body;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are LankaJourney.lk, an expert travel assistant specializing in Sri Lanka tourism. You help tourists plan trips, answer questions about destinations, activities, culture, visas, currency, weather, and local tips. Be friendly, concise, and always helpful. Provide practical, accurate information about Sri Lanka. If asked about bookings or specific prices, suggest they use the platform. Current session: ${session_id || 'new'}.`,
      messages: [
        ...(context?.history || []),
        { role: 'user', content: message }
      ]
    });

    const reply = response.content[0];
    if (reply.type !== 'text') { res.status(500).json({ success: false, message: 'AI error' }); return; }

    res.json({ success: true, message: 'Response generated', data: { reply: reply.text, session_id: session_id || `session_${Date.now()}` } });
  } catch (err) {
    console.error('getChatResponse:', err);
    res.status(500).json({ success: false, message: 'AI service error' });
  }
};

export const getSmartRecommendations = async (req: Request, res: Response): Promise<void> => {
  const { latitude, longitude, current_destination_id } = req.query;
  try {
    const lat = Number(latitude);
    const lon = Number(longitude);

    let nearbyAttractions: unknown[] = [];
    let nearbyActivities: unknown[] = [];
    let suggestedDestinations: unknown[] = [];

    if (lat && lon) {
      const nearby = await pool.query(
        `SELECT id, name, category, short_description, image_urls, rating,
         SQRT(POWER((latitude - $1) * 111, 2) + POWER((longitude - $2) * 111, 2)) as distance_km
         FROM destinations WHERE is_active=true AND latitude IS NOT NULL
         ORDER BY distance_km LIMIT 5`,
        [lat, lon]
      );
      suggestedDestinations = nearby.rows;
    }

    if (current_destination_id) {
      const [attractions, activities] = await Promise.all([
        pool.query('SELECT * FROM attractions WHERE destination_id=$1 ORDER BY distance_km LIMIT 5', [current_destination_id]),
        pool.query('SELECT * FROM activities WHERE destination_id=$1 AND is_active=true ORDER BY rating DESC LIMIT 4', [current_destination_id]),
      ]);
      nearbyAttractions = attractions.rows;
      nearbyActivities = activities.rows;
    }

    res.json({
      success: true, message: 'Recommendations ready', data: {
        nearby_attractions: nearbyAttractions,
        suggested_activities: nearbyActivities,
        suggested_destinations: suggestedDestinations,
      }
    });
  } catch (err) {
    console.error('getSmartRecommendations:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
