import Header from "@/components/header";
import Hero from "@/components/hero";
import Stats from "@/components/stats";
import Footer from "@/components/footer";

export const metadata = {
  title: "EduMastery - Empowering Professional Growth",
  description:
    "Accelerate your career with world-class certifications, hands-on projects, and expert-led curriculum designed for modern professionals.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <Header />
      <main className="flex-1 w-full gap-10 flex flex-col items-center justify-center">
        <Hero />
        <Stats />
      </main>
      <Footer />
    </div>
  );
}
