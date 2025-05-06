import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { PageLayout } from "@/components/layout/page-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Mail, FileCheck, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { SupportRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

function formatDate(dateString: string | undefined | null) {
  if (!dateString) return "Unknown date";
  return new Date(dateString).toLocaleString();
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  in_progress: "bg-amber-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500"
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <Mail className="h-4 w-4 mr-1" />,
  in_progress: <Clock className="h-4 w-4 mr-1" />,
  resolved: <CheckCircle className="h-4 w-4 mr-1" />,
  closed: <XCircle className="h-4 w-4 mr-1" />
};

export default function AdminSupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  // Admin authorization check
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  // Fetch support requests
  const { data: supportRequests, isLoading, error, refetch } = useQuery<SupportRequest[]>({
    queryKey: ["/api/admin/support-requests"],
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Update support request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; notes: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/support-requests/${data.id}`, {
        status: data.status,
        notes: data.notes
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-requests"] });
      toast({
        title: "Support request updated",
        description: "The support request has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form when a new request is selected
  useEffect(() => {
    if (selectedRequest) {
      setSelectedStatus(selectedRequest.status || "new");
      setAdminNotes(selectedRequest.notes || "");
    }
  }, [selectedRequest]);

  const handleSave = () => {
    if (!selectedRequest) return;
    
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: selectedStatus,
      notes: adminNotes
    });
  };

  const filteredRequests = supportRequests?.filter(request => {
    if (selectedTab === "all") return true;
    return request.status === selectedTab;
  });

  if (error) {
    return (
      <PageLayout heading="Admin Support Dashboard" subheading="Manage support requests">
        <div className="flex justify-center items-center h-40">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Error loading support requests</h3>
            <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout heading="Admin Support Dashboard" subheading="Manage user support requests">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request List Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Support Requests</CardTitle>
            <CardDescription>Total: {supportRequests?.length || 0}</CardDescription>
            <div className="mt-2">
              <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRequests && filteredRequests.length > 0 ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors
                        ${selectedRequest?.id === request.id 
                          ? 'bg-muted border-primary' 
                          : 'hover:bg-accent'}`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium line-clamp-1">{request.subject}</h4>
                        <Badge className={statusColors[request.status || "new"]}>
                          {statusIcons[request.status || "new"]}
                          {request.status || "New"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        From: {request.name} ({request.email})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(request.createdAt)}
                        {request.hasAttachment && " • Has attachment"}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-10">
                <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium">No support requests found</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTab === "all" 
                    ? "There are no support requests in the system." 
                    : `There are no ${selectedTab} support requests.`}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardFooter>
        </Card>

        {/* Request Details Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              {selectedRequest ? `Request #${selectedRequest.id} - ${selectedRequest.subject}` : "Select a request to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedRequest ? (
              <div className="text-center py-10">
                <FileCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium">No request selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a support request from the list to view details
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p>{selectedRequest.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Username</Label>
                    <p>{selectedRequest.username}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p>{selectedRequest.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p>{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <p className="font-medium">{selectedRequest.subject}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <pre className="whitespace-pre-wrap font-sans">{selectedRequest.message}</pre>
                  </div>
                </div>

                {selectedRequest.hasAttachment && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Attachment</Label>
                    <p>{selectedRequest.attachmentName || undefined}</p>
                    <p className="text-xs text-muted-foreground">
                      Note: Attachments are stored temporarily during development
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Admin Response</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Admin Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add notes about this request..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedRequest(null)}
              disabled={!selectedRequest}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!selectedRequest || updateRequestMutation.isPending}
              className="ml-2"
            >
              {updateRequestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
}