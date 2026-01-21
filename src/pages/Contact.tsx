import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sparkles, Mail, MapPin, Clock, Loader2, CheckCircle2 } from "lucide-react";
const contactSchema = z.object({
  name: z.string().min(2, "Namnet måste vara minst 2 tecken"),
  email: z.string().email("Ange en giltig e-postadress"),
  organization: z.string().optional(),
  role: z.string().optional(),
  subject: z.string().min(1, "Välj ett ämne"),
  message: z.string().min(10, "Meddelandet måste vara minst 10 tecken")
});
type ContactFormData = z.infer<typeof contactSchema>;
const subjectOptions = [{
  value: "interest",
  label: "Intresse för Notera"
}, {
  value: "pilot",
  label: "Pilotprogrammet (Grundskola)"
}, {
  value: "pro",
  label: "Skola Pro-förfrågan"
}, {
  value: "demo",
  label: "Demo-förfrågan"
}, {
  value: "support",
  label: "Teknisk support"
}, {
  value: "other",
  label: "Övrigt"
}];
const roleOptions = [{
  value: "teacher",
  label: "Lärare"
}, {
  value: "principal",
  label: "Rektor"
}, {
  value: "it",
  label: "IT-ansvarig"
}, {
  value: "other",
  label: "Annan"
}];
const Contact = () => {
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      organization: "",
      role: "",
      subject: "",
      message: ""
    }
  });

  // Pre-fill subject based on query parameter
  useEffect(() => {
    const subjectParam = searchParams.get("subject");
    if (subjectParam) {
      const validSubject = subjectOptions.find(opt => opt.value === subjectParam);
      if (validSubject) {
        form.setValue("subject", subjectParam);
      }
    }
  }, [searchParams, form]);
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.functions.invoke("send-contact-form", {
        body: data
      });
      if (error) throw error;
      setIsSuccess(true);
      form.reset();
      toast.success("Tack för ditt meddelande! Vi återkommer så snart som möjligt.");
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast.error("Något gick fel. Försök igen eller kontakta oss direkt via e-post.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] pointer-events-none animate-pulse-slow" />

      <Header />

      <div className="container mx-auto px-4 pt-32 pb-20 flex-grow relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Kontakt</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-white">
              Kontakta <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">Notera</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Vi hjälper dig gärna att komma igång. Fyll i formuläret så återkommer vi så snart som möjligt.
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="glass-card p-8 md:p-10 rounded-[2rem]">
                {isSuccess ? <div className="text-center py-12 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Tack för ditt meddelande!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Vi har mottagit ditt meddelande och återkommer så snart som möjligt, vanligtvis inom 24 timmar.
                    </p>
                    <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-4">
                      Skicka ett nytt meddelande
                    </Button>
                  </div> : <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="name" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>Namn *</FormLabel>
                              <FormControl>
                                <Input placeholder="Ditt namn" className="h-12 bg-white/5 border-white/10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="email" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>E-post *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="din.epost@skola.se" className="h-12 bg-white/5 border-white/10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="organization" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>Organisation / Skola</FormLabel>
                              <FormControl>
                                <Input placeholder="Skolans namn" className="h-12 bg-white/5 border-white/10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="role" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>Roll</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-white/5 border-white/10">
                                    <SelectValue placeholder="Välj din roll" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roleOptions.map(option => <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>} />
                      </div>

                      <FormField control={form.control} name="subject" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Ämne *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-white/5 border-white/10">
                                  <SelectValue placeholder="Vad gäller ditt ärende?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subjectOptions.map(option => <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="message" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Meddelande *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Beskriv hur vi kan hjälpa dig..." className="min-h-[150px] bg-white/5 border-white/10 resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all glow-primary">
                        {isSubmitting ? <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Skickar...
                          </> : <>
                            <Mail className="w-5 h-5 mr-2" />
                            Skicka meddelande
                          </>}
                      </Button>
                    </form>
                  </Form>}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-[2rem] space-y-6">
                <h3 className="text-xl font-bold text-white">Kontaktinformation</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">E-post</p>
                      <a href="mailto:kontakt@notera.se" className="text-white hover:text-primary transition-colors">
                        kontakt@notera.se
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plats</p>
                      <p className="text-white">Kalmar, Sverige</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Svarstid</p>
                      <p className="text-white">Inom 24 timmar</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-[2rem] space-y-4">
                <h3 className="text-xl font-bold text-white">Vanliga frågor</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-white">Hur kommer jag igång som lärare?</p>
                    <p className="text-muted-foreground">Kontakta oss så hjälper vi dig med onboarding och sätter upp ett konto åt din skola.</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">Är Notera gratis?</p>
                    <p className="text-muted-foreground">Under pilotperioden är det kostnadsfritt för skolor att testa plattformen.</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">Hur är det med GDPR?</p>
                    <p className="text-muted-foreground">Vi följer GDPR fullt ut och all data lagras säkert inom EU.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>;
};
export default Contact;