import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { UtensilsCrossed, Lock, User as UserIcon } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Bem-vindo!", description: `Olá, ${data.user.name}` });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Erro no login", 
          description: err.response?.data?.error || "Usuário ou senha inválidos"
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 40%, #0ea5e9 100%)" }}
    >
      {/* Decorative circles */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }} />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #93c5fd, transparent)" }} />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #bfdbfe, transparent)" }} />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/40 overflow-hidden">
          {/* Top Header Band */}
          <div className="px-10 pt-10 pb-8 text-center" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)" }}>
            <motion.div 
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg"
            >
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">LUXE POS</h1>
            <p className="text-blue-200 mt-1 text-sm tracking-wider uppercase">Sistema de Gestão</p>
          </div>

          {/* Form */}
          <div className="px-10 py-8">
            <p className="text-slate-500 text-sm text-center mb-6">Entre com suas credenciais para acessar</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Usuário</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="seu.usuario"
                    className="pl-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 text-slate-800"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 text-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold mt-2 rounded-xl"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #0ea5e9)" }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Autenticando..." : "Entrar no Sistema"}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs text-slate-400">Luxe Restaurant Systems © 2025</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
