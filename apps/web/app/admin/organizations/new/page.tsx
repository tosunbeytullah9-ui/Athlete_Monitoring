import { CreateOrganizationForm } from "./create-organization-form";

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Yeni Organizasyon Oluştur
        </h1>
        <p className="text-muted-foreground mt-1">
          Yeni bir federasyon veya kulüp için tenant oluştur.
        </p>
      </div>

      <CreateOrganizationForm />
    </div>
  );
}
