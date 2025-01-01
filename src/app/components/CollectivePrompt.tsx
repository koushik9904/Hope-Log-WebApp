'use client'
import React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDailyPrompts } from '../hooks/useDailyPrompts';
import { CircleLoader } from 'react-spinners';
import { toast } from 'react-toastify';

const schema = z.object({
    thoughts: z.string().min(1, 'Please share your thoughts.'),
});

type FormData = z.infer<typeof schema>;

const CollectivePrompt: React.FC = () => {

    const { isLoading, data, handlePromptSubmit} = useDailyPrompts();

    const { register, handleSubmit, formState: { errors }, reset} = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (thoughts: FormData) => {
       await handlePromptSubmit(thoughts.thoughts);
       toast.success("Your thoughts have been submitted successfully");
       reset()
    };


    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <CircleLoader color="#ffffff" />
                </div>
            )}
            <div className={`bg-white rounded-2xl p-4 mt-6 max-w-md mx-auto sm:max-w-lg md:max-w-3xl ${isLoading ? 'opacity-50' : ''}`}>
                <h2 className="text-ascent text-2xl">Today's Collective Prompt</h2>
                <p className="text-black text-lg">{data?.prompt}</p>
                <p className="text-black text-md mt-2">Emotion: {data?.emotion ? data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1) : 'N/A'}</p>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <textarea
                        rows={5}
                        className="w-full text-black mt-4 p-2 border border-gray-300 rounded"
                        placeholder="Type your thoughts here..."
                        {...register('thoughts')}
                    ></textarea>
                    {errors.thoughts && <p className="text-red-500">{errors.thoughts.message}</p>}
                    <button type="submit" className="rounded-2xl bg-ascent text-white py-2 px-4 mt-4">
                        Join the Global Conversation
                    </button>
                </form>
            </div>
        </>
    );

};

export default CollectivePrompt;