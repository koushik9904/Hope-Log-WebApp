import FeatureSession from "../components/FeatureSession";
import { BookIconSVG, FaceIconSVG, GlobeIconSVG, SeedlingIconSVG } from "../assets/assets";
import DynamicWorldMap from "../components/DynamicWorldMap";
import CollectivePrompt from "../components/CollectivePrompt";

const sections = [
  {
    header: "Annoymous Journaling Circles",
    mainText: "Join safe, annoymous spaces to share and support others.",
    icon: GlobeIconSVG,
  },
  {
    header: "AI Emotional Insights",
    mainText: "Get personalized feedback on your mood and tips to feel better.",
    icon: FaceIconSVG,
  },
  {
    header: "Voice & Visual Journaling",
    mainText: "Express your emotions in more ways than just text",
    icon: BookIconSVG,
  },
  {
    header: "Growth Tracking",
    mainText: "Growth Tracking: Track your emotional progress and celebrate small wins",
    icon: SeedlingIconSVG,
  },
];


export default function Home() {
  return (
    <main className="bg-dark text-white">
      <div className="container mx-auto p-4">
        <div className="block md:hidden text-center mt-3">
          <p>A Simple Daily Practice to Find Clarity Calm, and Self-understanding</p>
          <p className="text-4xl mt-4">Start Your Journey to Clarify, Growth and Connection</p>
          <p className="mt-4">“Join a growing community journaling their way to mental clarity and emotional growth.”</p>
          <button className="rounded-2xl bg-ascent text-white py-2 px-4 mt-4">
            Start Journaling | No Sign Up Required
          </button>
          <CollectivePrompt />
          {sections.map((section, index) => (
            <FeatureSession
              key={index}
              header={section.header}
              text={section.mainText}
              icon={section.icon}
            />
          ))}
          <div className="mt-20">
            <p className="text-2xl">Discover the World's Emotional Pulse</p>
            <p className="mt-2">See what's on Everyone's Mind Today</p>
          </div>
        </div>
      </div>
      <div className="hidden md:block lg:hidden">
        <div className="text-center mt-3 p-4">
          <p className="text-lg">A Simple Daily Practice to Find Clarity Calm, and Self-understanding</p>
          <p className="text-3xl mt-4">Start Your Journey to Clarify, Growth and Connection</p>
          <p className="mt-4 text-base">“Join a growing community journaling their way to mental clarity and emotional growth.”</p>
          <button className="rounded-2xl bg-ascent text-white py-2 px-4 mt-4">
            Start Journaling | No Sign Up Required
          </button>
          <CollectivePrompt />

          <div className="grid grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <FeatureSession
                key={index}
                header={section.header}
                text={section.mainText}
                icon={section.icon}
              />
            ))}
          </div>
          <div className="mt-20">
            <p className="text-2xl">Discover the World's Emotional Pulse</p>
            <p className="mt-2">See what's on Everyone's Mind Today</p>
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="text-center mt-3 p-4 max-w-4xl mx-auto">
          <p className="text-lg">A Simple Daily Practice to Find Clarity Calm, and Self-understanding</p>
          <p className="text-3xl mt-4">Start Your Journey to Clarify, Growth and Connection</p>
          <p className="mt-4 text-base">“Join a growing community journaling their way to mental clarity and emotional growth.”</p>
          <button className="rounded-2xl bg-ascent text-white py-2 px-4 mt-4">
            Start Journaling | No Sign Up Required
          </button>
          <CollectivePrompt />
          <div className="grid grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <FeatureSession
                key={index}
                header={section.header}
                text={section.mainText}
                icon={section.icon}
              />
            ))}
          </div>
          <div className="mt-20">
            <p className="text-2xl">Discover the World's Emotional Pulse</p>
            <p className="mt-2">See what's on Everyone's Mind Today</p>
          </div>
        </div>
      </div>
      <DynamicWorldMap />

    </main >
  );
}
