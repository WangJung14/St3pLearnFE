/**
 * API Route: GET /api/stats
 *
 * This is an example endpoint showing how to replace mock data with API data.
 *
 * Usage in component:
 * ```tsx
 * const { data: statsData } = useSWR('/api/stats', fetcher);
 * ```
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace this mock data with database query
    // const stats = await db.select().from(statsTable);

    const statsData = [
      {
        value: '2.5M+',
        label: 'Total Students',
      },
      {
        value: '4,500+',
        label: 'Professional Courses',
      },
      {
        value: '850k+',
        label: 'Certified Graduates',
      },
      {
        value: '1,200+',
        label: 'Industry Instructors',
      },
    ];

    return NextResponse.json(statsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
