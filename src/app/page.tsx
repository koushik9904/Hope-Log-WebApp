
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
          <div className="bg-white rounded-2xl p-4 mt-6">
            <h2 className="text-ascent text-2xl">Today's Collective Prompt</h2>
            <p className="text-black text-lg">What brought you joy today?</p>
            <textarea
              className="w-full mt-4 p-2 border border-gray-300 rounded"
              placeholder="Type your thoughts here..."
            ></textarea>
            <button className="rounded-2xl bg-ascent text-white py-2 px-4 mt-4">
              Join the Global Conversation
            </button>
          </div>
        </div>

        <div className="hidden md:block lg:hidden">Tablet Container</div>
        <div className="hidden lg:block">Desktop Container</div>
      </div>
    </main>
  );
}
