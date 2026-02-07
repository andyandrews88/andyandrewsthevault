import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface TrialExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrialExpiredModal({ open, onOpenChange }: TrialExpiredModalProps) {
  const { redirectToPayment, signOut } = useAuthStore();

  const handleSubscribe = () => {
    redirectToPayment();
  };

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <DialogTitle className="text-xl">Your Free Trial Has Ended</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Your 7-day free trial of Performance Architect has expired. Subscribe now to continue accessing The Vault and all premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Performance Architect</p>
              <p className="text-sm text-muted-foreground">Full access to The Vault</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">$30</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full sm:w-auto"
          >
            Sign Out
          </Button>
          <Button 
            variant="hero" 
            onClick={handleSubscribe}
            className="w-full sm:w-auto gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Subscribe Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
