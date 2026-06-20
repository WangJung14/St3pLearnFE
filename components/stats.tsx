interface Stat {
  value: string;
  label: string;
}

const statsData: Stat[] = [
  { value: '2.5M+', label: 'Total Students' },
  { value: '4,500+', label: 'Professional Courses' },
  { value: '850k+', label: 'Certified Graduates' },
  { value: '1,200+', label: 'Industry Instructors' },
];

export default function Stats() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-xl border border-outline-variant shadow-soft flex flex-col items-center justify-center text-center"
        >
          <span className="font-headline-lg text-headline-lg text-primary">
            {stat.value}
          </span>
          <span className="font-body-sm text-body-sm text-secondary mt-2">
            {stat.label}
          </span>
        </div>
      ))}
    </section>
  );
}
