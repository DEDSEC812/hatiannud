import { useState } from "react";
import { useGetMe, useAdminStats, useAdminListVideos, useAdminCreateVideo, useAdminUpdateVideo, useAdminDeleteVideo, useAdminListUsers, useAdminBlockUser, useAdminListTickets, useAdminReplyTicket, getAdminListVideosQueryKey, getAdminListUsersQueryKey, getAdminListTicketsQueryKey } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, Video, DollarSign, Download, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const CONTENT_TYPES = [
  "Vidéo", "Photo", "Kompa", "Rasin", "Dancehall", "Zouk", "Rara",
  "Vodou", "Rap", "Trap", "Afrobeat", "Autres",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2009 }, (_, i) => String(CURRENT_YEAR - i));

export function Admin() {
  const { data: me, isLoading: isLoadingMe } = useGetMe();
  const queryClient = useQueryClient();

  if (isLoadingMe) return <div className="p-8 text-center">Chargement...</div>;
  if (!me?.isAdmin) return (
    <div className="p-24 text-center">
      <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
      <h1 className="text-3xl font-bold">Accès Refusé</h1>
      <p className="text-muted-foreground mt-2">Vous n'avez pas les droits d'administration.</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" /> 
        Panneau d'Administration
      </h1>

      <AdminStatsCards />

      <Tabs defaultValue="videos" className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="videos">Vidéos</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos"><VideosTab queryClient={queryClient} /></TabsContent>
        <TabsContent value="users"><UsersTab queryClient={queryClient} /></TabsContent>
        <TabsContent value="tickets"><TicketsTab queryClient={queryClient} /></TabsContent>
      </Tabs>
    </div>
  );
}

function AdminStatsCards() {
  const { data: stats } = useAdminStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard title="Utilisateurs" value={stats?.totalUsers || 0} icon={Users} />
      <StatCard title="Membres VIP" value={stats?.activeVip || 0} icon={DollarSign} color="text-yellow-500" />
      <StatCard title="Vidéos" value={stats?.totalVideos || 0} icon={Video} />
      <StatCard title="Vues" value={stats?.totalViews || 0} icon={Shield} />
      <StatCard title="Téléchargements" value={stats?.totalDownloads || 0} icon={Download} />
      <StatCard title="Tickets Ouverts" value={stats?.openTickets || 0} icon={Ticket} color="text-destructive" />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-primary" }: any) {
  return (
    <Card className="bg-card">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <Icon className={`h-6 w-6 mb-2 ${color}`} />
        <div className="text-2xl font-bold font-mono">{value}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{title}</div>
      </CardContent>
    </Card>
  );
}

function VideosTab({ queryClient }: { queryClient: any }) {
  const { data: videos, isLoading } = useAdminListVideos();
  const [open, setOpen] = useState(false);
  const createVideo = useAdminCreateVideo();
  const deleteVideo = useAdminDeleteVideo();

  const [contentType, setContentType] = useState("Vidéo");
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    videoUrl: "",
    durationSec: 120,
    isVip: false,
    published: true,
  });

  const buildCategory = () => `${contentType} ${year}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVideo.mutateAsync({
        data: { ...formData, category: buildCategory() },
      });
      toast.success("Vidéo ajoutée");
      setOpen(false);
      setFormData({ title: "", description: "", thumbnailUrl: "", videoUrl: "", durationSec: 120, isVip: false, published: true });
      setContentType("Vidéo");
      setYear(String(CURRENT_YEAR));
      queryClient.invalidateQueries({ queryKey: getAdminListVideosQueryKey() });
    } catch {
      toast.error("Erreur d'ajout");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette vidéo ?")) return;
    try {
      await deleteVideo.mutateAsync({ id });
      toast.success("Vidéo supprimée");
      queryClient.invalidateQueries({ queryKey: getAdminListVideosQueryKey() });
    } catch {
      toast.error("Erreur de suppression");
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestion des Vidéos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Ajouter une vidéo</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nouvelle Vidéo</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              {/* Category = Type + Year */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de contenu</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Année" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground">
                Catégorie finale : <span className="font-semibold text-foreground">{buildCategory()}</span>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>URL Miniature</Label>
                <Input required value={formData.thumbnailUrl} onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>URL Vidéo</Label>
                <Input required value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durée (sec)</Label>
                  <Input type="number" required value={formData.durationSec} onChange={e => setFormData({ ...formData, durationSec: Number(e.target.value) })} />
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.isVip} onCheckedChange={c => setFormData({ ...formData, isVip: c })} />
                    <Label>Réservé VIP</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.published} onCheckedChange={c => setFormData({ ...formData, published: c })} />
                    <Label>Publié</Label>
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={createVideo.isPending} className="w-full mt-4">
                {createVideo.isPending ? "Enregistrement..." : "Enregistrer la vidéo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Vues</TableHead>
              <TableHead>VIP</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos?.map(v => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.title}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">{v.category}</span>
                </TableCell>
                <TableCell>{v.views}</TableCell>
                <TableCell>{v.isVip ? "Oui" : "Non"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function UsersTab({ queryClient }: { queryClient: any }) {
  const { data: users } = useAdminListUsers();
  const blockUser = useAdminBlockUser();

  const handleToggleBlock = async (id: string, currentBlocked: boolean) => {
    try {
      await blockUser.mutateAsync({ id, data: { blocked: !currentBlocked } });
      toast.success(currentBlocked ? "Utilisateur débloqué" : "Utilisateur bloqué");
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
    } catch {
      toast.error("Erreur d'action");
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader><CardTitle>Utilisateurs</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(u => (
              <TableRow key={u.id} className={u.blocked ? "opacity-50" : ""}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${u.plan === 'vip' ? 'bg-primary text-white' : 'bg-muted'}`}>
                    {u.plan.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>{format(new Date(u.createdAt), "dd/MM/yyyy")}</TableCell>
                <TableCell>{u.blocked ? <span className="text-destructive font-medium">Bloqué</span> : "Actif"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleBlock(u.id, u.blocked)}
                    className={u.blocked ? "text-green-500" : "text-destructive"}
                  >
                    {u.blocked ? "Débloquer" : "Bloquer"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TicketsTab({ queryClient }: { queryClient: any }) {
  const { data: tickets } = useAdminListTickets();
  const replyTicket = useAdminReplyTicket();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");

  const handleReply = async () => {
    if (!selectedTicket || !replyText) return;
    try {
      await replyTicket.mutateAsync({ id: selectedTicket.id, data: { reply: replyText } });
      toast.success("Réponse envoyée");
      setSelectedTicket(null);
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: getAdminListTicketsQueryKey() });
    } catch {
      toast.error("Erreur de réponse");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-card">
        <CardHeader><CardTitle>Tickets de Support</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tickets?.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${selectedTicket?.id === t.id ? 'border-primary' : 'border-border'}`}
              >
                <div className="flex justify-between">
                  <h4 className="font-semibold">{t.subject}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${t.status === 'open' ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{t.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-1 bg-card">
        <CardHeader><CardTitle>Répondre</CardTitle></CardHeader>
        <CardContent>
          {selectedTicket ? (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Message Original</Label>
                <div className="p-3 bg-muted rounded mt-1 text-sm">{selectedTicket.message}</div>
              </div>
              {selectedTicket.reply && (
                <div>
                  <Label className="text-muted-foreground">Réponse Précédente</Label>
                  <div className="p-3 bg-primary/10 text-primary rounded mt-1 text-sm">{selectedTicket.reply}</div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Votre Réponse</Label>
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={5} className="resize-none" />
              </div>
              <Button onClick={handleReply} disabled={!replyText || replyTicket.isPending} className="w-full">
                Envoyer & Fermer
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Sélectionnez un ticket pour répondre</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
