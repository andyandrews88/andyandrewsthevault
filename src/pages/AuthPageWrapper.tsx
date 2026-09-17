// Sign-in entry for the closed coaching platform.
// No marketing navbar/footer here — The Vault is members-only.
import { AuthPage } from "@/pages/Auth";

const AuthPageWrapper = () => {
  return (
    <div className="min-h-screen bg-background">
      <AuthPage />
    </div>
  );
};

export default AuthPageWrapper;
