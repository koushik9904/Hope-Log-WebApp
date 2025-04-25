import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContact } from "../hooks/useContact";
import { z } from "zod";
import { ClipLoader } from "react-spinners";



const contactFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(500, "Message must be less than 500 characters")
});


type ContactFormData = z.infer<typeof contactFormSchema>;

const ContactMe = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactFormSchema),
    });

    const { handleContactForm, isLoading } = useContact();

    const onSubmit = async (data: ContactFormData) => {
        try {
            await handleContactForm(data.title, data.message);
            reset();
        } catch (error) {
            throw error;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white px-4 py-8 md:py-12" id="contact-me">
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <ClipLoader color="#ffffff" />
                </div>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 text-center">Contact Me</h1>
            <p className="text-center text-base md:text-lg mb-8 md:mb-12 max-w-md mx-auto">
                Have any questions or suggestions? Drop us a line and we'll help you out!
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg space-y-4 md:space-y-6 px-4 md:px-0">
                <div className="space-y-1 md:space-y-2">
                    <input
                        {...register("title")}
                        placeholder="Enter your title here."
                        className="w-full p-3 md:p-4 rounded-lg bg-[#3B3B52] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.title && (
                        <p className="text-red-500 text-xs md:text-sm">{errors.title.message}</p>
                    )}
                </div>

                <div className="space-y-1 md:space-y-2">
                    <textarea
                        {...register("message")}
                        placeholder="Enter your message here. Include your email if you want a response."
                        className="w-full p-3 md:p-4 rounded-lg bg-[#3B3B52] focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 md:h-40 resize-none"
                    />
                    {errors.message && (
                        <p className="text-red-500 text-xs md:text-sm">{errors.message.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 md:py-4 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-medium"
                >
                    {isSubmitting ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
};

export default ContactMe;
