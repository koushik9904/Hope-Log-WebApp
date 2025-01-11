import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';

const DisclaimerModal = () => {
    const [open, setOpen] = useState(true);

    const handleAgree = () => {
        setOpen(false);
    };

    return (
        <Modal open={open} onClose={() => setOpen(false)} center>
            <div className="p-6 bg-white rounded-lg max-w-2xl mx-auto text-gray-800">
                <h2 className="text-xl font-bold mb-4">Important Disclaimer</h2>
                <p className="mb-4">
                    1. This tool is not a professional AI therapist and is not intended to provide diagnoses. Personal responsibility is required when using this app. If you need professional help, please seek assistance from a licensed therapist.
                </p>
                <p className="mb-4">
                    2. Your data is securely stored and tied to your user account. While it is not fully anonymized, we ensure that it is kept confidential and safeguarded using industry-standard security measures.
                </p>
                <p className="mb-4">
                    3. Please note that as we continue to improve the Feelings AI bot, some responses may be infactual or inaccurate. Use the bot as a supportive tool, but not as a replacement for professional guidance.
                </p>
                <p className="mb-4">
                    4. Since this tool may involve sharing personal information, feelings, or emotions that could be linked to mental health or medical conditions, we are committed to transparency about our data practices:
                </p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Your data is tied to your user account to provide personalized support.</li>
                    <li>We do not share your data with external parties without your consent.</li>
                    <li>The data is stored securely, and only authorized personnel have access to it.</li>
                    <li>We use your data to enhance the bot’s capabilities and improve user experience.</li>
                </ul>
                <p className="mb-6">By using this tool, you acknowledge that you understand and accept these terms.</p>
                <button
                    onClick={handleAgree}
                    className="w-full bg-ascent text-white font-semibold py-2 px-4 rounded"
                >
                    I Understand
                </button>
            </div>
        </Modal >
    );
};

export default DisclaimerModal;
