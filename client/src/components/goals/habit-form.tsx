import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { insertHabitSchema, Habit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Extend the habit schema with more validations
const habitFormSchema = insertHabitSchema;

type HabitFormValues = z.infer<typeof habitFormSchema>;

interface HabitFormProps {
  onSuccess?: () => void;
  initialData?: Habit;
  userId: number;
}

export default function HabitForm({ onSuccess, initialData, userId }: HabitFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define default values based on initial data
  const defaultValues: Partial<HabitFormValues> = {
    userId: userId,
    title: initialData?.title || "",
    description: initialData?.description || "",
    frequency: initialData?.frequency || "daily",
    colorScheme: initialData?.colorScheme || 1,
  };

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues,
  });

  // Set up the mutation for creating/updating habits
  const mutation = useMutation({
    mutationFn: async (values: HabitFormValues) => {
      // Format the values for the API
      const formattedValues = {
        ...values,
      };

      // Determine if we're creating or updating
      if (initialData) {
        const res = await apiRequest("PATCH", `/api/habits/${initialData.id}`, formattedValues);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/habits", formattedValues);
        return res.json();
      }
    },
    onSuccess: () => {
      // Show success message
      toast({
        title: initialData ? "Habit updated" : "Habit created",
        description: initialData
          ? "Your habit has been updated successfully."
          : "Your habit has been created successfully.",
      });

      // Clear the form if it's a new habit
      if (!initialData) {
        form.reset(defaultValues);
      }

      // Invalidate queries to refresh the habits list
      queryClient.invalidateQueries({ queryKey: ["/api/habits", userId] });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Failed to save habit:", error);
      toast({
        title: "Error",
        description: "Failed to save habit. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: HabitFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter habit title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your habit..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>How often do you want to perform this habit?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorScheme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-[#F5B8DB] mr-2"></div>
                      Pink
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-[#B6CAEB] mr-2"></div>
                      Blue
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-[#9AAB63] mr-2"></div>
                      Green
                    </div>
                  </SelectItem>
                  <SelectItem value="4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-[#F5D867] mr-2"></div>
                      Yellow
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Update Habit" : "Create Habit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}