/**
 * SWR Fetcher Configuration
 *
 * Use this in your components to fetch data from API routes.
 *
 * Example:
 * ```tsx
 * import useSWR from 'swr';
 * import { fetcher } from '@/lib/fetcher';
 *
 * export default function Stats() {
 *   const { data, isLoading, error } = useSWR('/api/stats', fetcher);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <section>
 *       {data?.map((stat) => (
 *         <div key={stat.label}>
 *           <span>{stat.value}</span>
 *           <span>{stat.label}</span>
 *         </div>
 *       ))}
 *     </section>
 *   );
 * }
 * ```
 */

interface FetchError extends Error {
  status?: number;
  info?: unknown;
}

export const fetcher = async (url: string): Promise<unknown> => {
  const res = await fetch(url);

  // If the status code is not in the range 200-299, we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.'
    ) as FetchError;
    // Attach extra info to the error object.
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};
