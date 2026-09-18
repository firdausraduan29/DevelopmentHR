import { useLocation } from "wouter";
import { ApplyLeaveForm } from "@/components/ApplyLeaveForm";

export default function ApplyLeavePage() {
  const [, setLocation] = useLocation();

  const handleSubmit = () => {
    // todo: remove mock functionality - will make API call
    setLocation("/");
  };

  const handleCancel = () => {
    setLocation("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Apply for Leave</h1>
        <p className="text-muted-foreground mt-1">Submit a new leave request for approval.</p>
      </div>
      <ApplyLeaveForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
