import { User } from "@shared/schema";
import { format } from "date-fns";

type DashboardHeaderProps = {
  user: User | null;
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

  return (
    <header className="bg-white shadow-sm p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold font-nunito text-neutral-dark">
            Welcome back, {user?.username}
          </h1>
          <p className="text-neutral-medium">{formattedDate}</p>
        </div>
        <div className="hidden md:block">
          <div className="flex items-center">
            <button className="mr-4 text-neutral-medium hover:text-primary">
              <i className="ri-notification-3-line text-xl"></i>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center text-primary">
              {user?.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <button className="md:hidden text-neutral-medium">
          <i className="ri-menu-line text-xl"></i>
        </button>
      </div>
    </header>
  );
}
