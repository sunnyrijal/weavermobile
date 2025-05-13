
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, CreditCard, Download, HelpCircle } from "lucide-react";

const plans = [
  {
    name: "Free Tier",
    price: "$0",
    period: "/ month",
    features: [
      "Up to 100 contacts",
      "Basic relationship mapping",
      "Manual data import",
      "Community support",
    ],
    isCurrent: false,
    cta: "Your Current Plan",
    variant: "outline" as "outline" | "default" | "secondary",
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/ month",
    features: [
      "Up to 1,000 contacts",
      "Advanced relationship mapping",
      "OAuth imports (LinkedIn, etc.)",
      "AI-powered tagging",
      "Priority email support",
    ],
    isCurrent: true, // Example: user is on Pro plan
    cta: "Manage Subscription",
    variant: "default" as "outline" | "default" | "secondary",
  },
  {
    name: "Business",
    price: "$29.99",
    period: "/ month",
    features: [
      "Unlimited contacts",
      "Team collaboration features",
      "Advanced analytics",
      "API access",
      "Dedicated account manager",
    ],
    isCurrent: false,
    cta: "Upgrade to Business",
    variant: "secondary" as "outline" | "default" | "secondary",
  },
];

const paymentMethods = [
  { id: "pm_1", type: "Visa", last4: "4242", expiry: "12/25", isDefault: true },
  { id: "pm_2", type: "Mastercard", last4: "5555", expiry: "06/27", isDefault: false },
];

const invoiceHistory = [
  { id: "inv_1", date: "2024-07-01", amount: "$9.99", status: "Paid", pdfUrl: "#" },
  { id: "inv_2", date: "2024-06-01", amount: "$9.99", status: "Paid", pdfUrl: "#" },
  { id: "inv_3", date: "2024-05-01", amount: "$9.99", status: "Paid", pdfUrl: "#" },
];

export default function BillingPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
        <p className="text-muted-foreground">Manage your NetworkNest plan, payment methods, and view invoice history.</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Choose the plan that best suits your networking needs.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`flex flex-col ${plan.isCurrent ? 'border-primary ring-2 ring-primary shadow-xl' : 'hover:shadow-lg transition-shadow'}`}>
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-3xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                </p>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.variant} disabled={plan.isCurrent && plan.cta === "Your Current Plan"}>
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="text-primary"/> Payment Methods</CardTitle>
            <CardDescription>Manage your saved payment methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map(pm => (
              <div key={pm.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                   {/* Basic card type visualization */}
                  <div className={`w-10 h-7 rounded bg-muted flex items-center justify-center text-xs font-semibold ${pm.type === 'Visa' ? 'text-blue-600' : 'text-orange-500'}`}>
                    {pm.type}
                  </div>
                  <div>
                    <p className="font-medium">{pm.type} ending in {pm.last4}</p>
                    <p className="text-xs text-muted-foreground">Expires {pm.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {pm.isDefault && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Default</span>}
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full sm:w-auto">Add New Payment Method</Button>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View and download your past invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            {invoiceHistory.length > 0 ? (
              <ul className="space-y-2">
                {invoiceHistory.map(invoice => (
                  <li key={invoice.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 gap-2 sm:gap-0">
                    <div>
                      <p className="font-medium">Invoice #{invoice.id.split('_')[1]}</p>
                      <p className="text-xs text-muted-foreground">Date: {invoice.date} - Amount: {invoice.amount}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Download PDF
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No invoice history available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><HelpCircle className="text-primary"/>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">If you have any questions about your billing or subscription, please contact our support team.</p>
            <Button variant="outline" className="w-full sm:w-auto">Contact Support</Button>
        </CardContent>
      </Card>

    </div>
  );
}

