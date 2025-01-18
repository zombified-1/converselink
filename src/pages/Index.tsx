import { useState } from "react";
import { Inbox } from "@/components/company/Inbox";
import { ChatWidget } from "@/components/user/ChatWidget";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [view, setView] = useState<"company" | "user">("user");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            variant={view === "company" ? "default" : "outline"}
            onClick={() => setView("company")}
          >
            View as Company
          </Button>
          <Button
            variant={view === "user" ? "default" : "outline"}
            onClick={() => setView("user")}
          >
            View as User
          </Button>
        </div>

        {view === "company" ? (
          <Inbox />
        ) : (
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Welcome to Our Website</h1>
              <p className="text-xl text-gray-600 mb-8">
                Need help? Chat with our support team!
              </p>
              <ChatWidget companyName="Our Company" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;