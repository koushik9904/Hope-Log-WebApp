import * as React from 'react';
import Image from 'next/image';
import { WritingSoldSVG, RobotSolidSVG, LightBulbSolidSVG } from '../assets/assets';

const HowJournalingWorks = () => {
    return (
        <div className="flex flex-col items-center py-16 px-16" id="how-journaling-works">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">How JournalAI Works</h2>
                <p className="text-xl text-white">Start your journaling journey in three simple steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-16">
                <div className="bg-white rounded-lg p-8 text-center shadow-lg">
                    <div className="relative mb-4">
                        <span className="absolute -top-4 -left-4 w-8 h-8 bg-[#333333] rounded-full text-white flex items-center justify-center">1</span>
                        <Image src={WritingSoldSVG.src} alt="Writing" width={64} height={64} className="mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2">Start Writing</h3>
                    <p className="text-gray-600">Begin your daily journaling practice with our intuitive editor. Write freely about your thoughts and feelings.</p>
                </div>

                <div className="bg-white rounded-lg p-8 text-center shadow-lg">
                    <div className="relative mb-4">
                        <span className="absolute -top-4 -left-4 w-8 h-8 bg-[#333333] rounded-full text-white flex items-center justify-center">2</span>
                        <Image src={RobotSolidSVG.src} alt="AI Analysis" width={64} height={64} className="mx-auto" />
                    </div>
                    <h3 className="text-xl text-black font-bold mb-2">AI Analysis</h3>
                    <p className="text-gray-600">Our AI analyzes your entries to identify patterns, emotions and themes in your writing.</p>
                </div>

                <div className="bg-white rounded-lg p-8 text-center shadow-lg">
                    <div className="relative mb-4">
                        <span className="absolute -top-4 -left-4 w-8 h-8 bg-[#333333] rounded-full text-white flex items-center justify-center">3</span>
                        <Image src={LightBulbSolidSVG.src} alt="Insights" width={64} height={64} className="mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-black mb-2">Gain Insights</h3>
                    <p className="text-gray-600">Receive personalized insights, recommendations, and visualization of your emotional journey.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg p-8 max-w-6xl w-full">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-6 md:mb-0 md:mr-8 text-center md:text-left">
                        <h3 className="text-2xl text-black font-bold mb-2">See it in Action</h3>
                        <p className="text-gray-600 mb-4">Watch how JournalAI helps transform your daily journaling practice into meaningful insights.</p>
                        <div className="flex justify-center md:justify-start">
                            <button className="bg-[#333333] text-white px-6 py-2 rounded-lg flex items-center">
                                Watch Demo
                                <span className="ml-2">→</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-gray-200 w-full md:w-1/2 aspect-video rounded-lg"></div>
                </div>
            </div>
        </div>
    );
};

export default HowJournalingWorks;


