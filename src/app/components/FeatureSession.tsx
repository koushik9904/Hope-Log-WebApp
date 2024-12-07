import React from 'react';
import Image from "next/image";


type FeatureSessionProps = {
    header: string;
    text: string;
    icon: string;
};

const FeatureSession = ({ header, text, icon }: FeatureSessionProps) => {
    return (
        <div className="text-white mt-8 text-left">
            <div className="flex justify-between items-center font-poppins text-16 font-medium">
                <p className="text-base fontWeight-semibold">{header}</p>
                <Image src={icon as string}
                    alt="icon"
                    width={16}
                    color='white'
                    height={16}
                />
            </div>
            <div className="text-sm">
                {text}
            </div>
        </div>
    );
};

export default FeatureSession;