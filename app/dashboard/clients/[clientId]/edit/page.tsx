import { prisma } from "@/lib/prisma"
import EditClientForm from "@/components/EditClientForm"; // <--- Import new component



export default async function EditClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;

  // Fetch client AND their vehicles
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      vehicles: true // <--- IMPORTANT: Fetch vehicles too
    }
  });

  if (!client) return <div className="p-8">Client not found</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Client & Fleet</h2>
        <p className="text-gray-500">Update information for <span className="font-bold">{client.fullName}</span></p>
      </div>

      {/* Render the Client Component */}
      <EditClientForm client={client} />
      
    </div>
  );
}