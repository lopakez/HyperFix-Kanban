import { createFileRoute } from "@tanstack/react-router";
import { AssistantFullPage } from "@/components/ai/assistant-full-page";
import Layout from "@/components/common/layout";

export const Route = createFileRoute("/_layout/_authenticated/ai")({
  component: AIPageComponent,
});

function AIPageComponent() {
  return (
    <Layout>
      <Layout.Header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Assistant IA</span>
        </div>
      </Layout.Header>
      <Layout.Content>
        <AssistantFullPage />
      </Layout.Content>
    </Layout>
  );
}
