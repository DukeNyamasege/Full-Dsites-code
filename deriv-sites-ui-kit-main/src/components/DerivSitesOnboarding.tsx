import { useState } from "react";
import { Globe, Check, CreditCard, ArrowRight, Phone, Mail, Loader2, CheckCircle2, XCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import BuyDomainDialog from "@/components/BuyDomainDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { useCallback, useEffect } from "react";

type View = 'plans' | 'payment' | 'processing' | 'success' | 'failed';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DerivSitesOnboarding = () => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  
  // Payment state for one-time fee
  const [view, setView] = useState<View>('plans');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentPurchaseId, setCurrentPurchaseId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const handlePaymentSuccess = useCallback(() => {
    setView('success');
    setCurrentPurchaseId(null);
  }, []);

  const handlePaymentFailure = useCallback((purchase: { failure_reason: string | null }) => {
    setFailureReason(purchase.failure_reason || 'Payment was not completed');
    setView('failed');
    setCurrentPurchaseId(null);
  }, []);

  const { isPolling } = usePaymentPolling(
    currentPurchaseId,
    handlePaymentSuccess,
    handlePaymentFailure
  );

  // Countdown timer
  useEffect(() => {
    if (view === 'processing' && isPolling) {
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, isPolling]);

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    if (!emailRegex.test(emailValue.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleOneTimePayment = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/-/g, '');
    if (!/^(\+?254|0)?[17]\d{8}$/.test(cleanPhone)) {
      toast.error('Please enter a valid Kenyan phone number');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone: phoneNumber.trim(),
          amount: 25000,
          domain: 'derivsites-ownership-fee',
          email: email.trim(),
          accountReference: 'DerivSites Full Ownership'
        }
      });

      if (error) {
        console.error('Payment error:', error);
        toast.error('Failed to initiate payment');
        return;
      }

      if (data.error) {
        console.error('Payment API error:', data.error);
        toast.error(data.error);
        return;
      }

      toast.success('STK push sent! Please enter your M-Pesa PIN on your phone.');
      setCurrentPurchaseId(data.purchaseId);
      setView('processing');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleBack = () => {
    if (view === 'processing') return;
    setView('plans');
    setPhoneNumber("");
    setEmail("");
    setEmailError(null);
    setFailureReason(null);
  };

  const handleRetry = () => {
    setFailureReason(null);
    setView('payment');
  };

  // Processing view
  if (view === 'processing') {
    return (
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="dashed-border rounded-2xl panel-bg min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center p-6 sm:p-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl gradient-purple flex items-center justify-center glow-purple mb-6">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-foreground animate-spin" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 text-center">
            Waiting for Payment
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-4 text-sm sm:text-base">
            Please check your phone and enter your M-Pesa PIN to complete the payment.
          </p>
          <div className="text-3xl sm:text-4xl font-bold text-primary mb-6">{countdown}s</div>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="text-foreground font-semibold">KES 25,000</span>
          </p>
        </div>
      </div>
    );
  }

  // Success view
  if (view === 'success') {
    return (
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="dashed-border rounded-2xl panel-bg min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center p-6 sm:p-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 text-center">
            Payment Successful!
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-6 text-sm sm:text-base px-2">
            You now have full ownership of DerivSites for 12 months. You can now proceed to set up your domain and site.
          </p>
          <Button 
            onClick={() => setIsBuyDialogOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Set Up Your Domain
          </Button>
        </div>
        <BuyDomainDialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen} />
      </div>
    );
  }

  // Failed view
  if (view === 'failed') {
    return (
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="dashed-border rounded-2xl panel-bg min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center p-6 sm:p-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6">
            <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 text-center">
            Payment Failed
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-2 text-sm sm:text-base px-2">
            {failureReason || 'Your payment could not be completed.'}
          </p>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Please try again or contact support if the issue persists.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleRetry} className="btn-primary w-full sm:w-auto">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment form view for one-time fee
  if (view === 'payment') {
    return (
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-lg mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-4 sm:mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="rounded-2xl panel-bg border border-white/10 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-purple flex items-center justify-center">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Complete Payment</h2>
                <p className="text-muted-foreground text-sm">One-time ownership fee</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Full Ownership (12 months)</span>
                <span className="text-2xl font-bold text-foreground">KES 25,000</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pay with M-Pesa</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an STK push on your phone
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    className={`pl-10 bg-sidebar-bg border-white/10 focus:border-primary/50 h-12 ${emailError ? 'border-red-500' : ''}`}
                    type="email"
                  />
                </div>
                {emailError && <p className="text-xs text-red-400">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  M-Pesa Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 bg-sidebar-bg border-white/10 focus:border-primary/50 h-12 text-lg"
                    type="tel"
                  />
                </div>
              </div>

              <Button 
                onClick={handleOneTimePayment}
                disabled={isProcessingPayment || !phoneNumber.trim() || !email.trim()}
                className="w-full btn-primary h-12 text-base"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay KES 25,000
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main plans view - Full Ownership only
  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl gradient-purple flex items-center justify-center glow-purple mx-auto mb-4">
            <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Welcome to DerivSites</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base px-2">
            DerivSites is a Deriv-powered third-party software used to create Deriv third-party websites at a more affordable cost.
          </p>
        </div>

        {/* Full Ownership Plan Card */}
        <div className="p-6 sm:p-8 rounded-2xl border-2 border-primary bg-primary/10 relative mb-6">
          <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-primary text-xs font-semibold text-foreground">
            Full Ownership
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Full Ownership</h3>
              <p className="text-sm text-muted-foreground">One-time payment, 12 months access</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-foreground mb-1">KES 25,000</div>
          <p className="text-sm text-muted-foreground mb-5">one-time fee</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              Keep 100% of your commissions
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              Full site ownership for 12 months
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              Custom domain included
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              Best for high earners
            </li>
          </ul>
        </div>

        {/* Terms */}
        <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4 sm:mb-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-foreground font-medium mb-1">Important Notice</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Earning commissions is not guaranteed and depends entirely on the strength and activity of your community.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start gap-3 mb-4 sm:mb-6">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            className="mt-0.5 sm:mt-1"
          />
          <label htmlFor="terms" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">
            By continuing, I agree to the{" "}
            <a href="#" className="text-primary hover:underline">terms and conditions</a>
            {" "}and understand that earning commissions depends on my community's activity.
          </label>
        </div>

        {/* Proceed Button */}
        <Button
          onClick={() => setView('payment')}
          disabled={!agreedToTerms}
          className="w-full btn-primary h-11 sm:h-12 text-sm sm:text-base"
        >
          Proceed to Payment
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <BuyDomainDialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen} />
    </div>
  );
};

export default DerivSitesOnboarding;
