import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Email validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { forgotPasswordMutation } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordData) => {
    forgotPasswordMutation.mutate(data, {
      onSuccess: () => {
        setSubmitted(true);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 mr-2 hover:bg-transparent"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-medium">Reset your password</h3>
      </div>

      {submitted ? (
        <div className="text-center py-6">
          <h4 className="font-medium mb-2">Check your email</h4>
          <p className="text-sm text-muted-foreground mb-4">
            If an account exists with the email you provided, we've sent instructions to reset your password.
          </p>
          <Button variant="outline" onClick={onBack}>
            Return to login
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input className="pi-input h-9" placeholder="Enter your email address" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/80 text-white h-9 mt-2"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}