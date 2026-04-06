import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { otherUserId } = await req.json();
    if (!otherUserId) {
      return new Response(JSON.stringify({ error: "otherUserId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check if a direct conversation already exists between these two users
    const { data: userConvos } = await adminClient
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (userConvos && userConvos.length > 0) {
      const convIds = userConvos.map((c: any) => c.conversation_id);
      
      // Check if other user is in any of these conversations
      const { data: otherInConvos } = await adminClient
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", convIds);

      if (otherInConvos && otherInConvos.length > 0) {
        // Verify it's a direct conversation
        const { data: conv } = await adminClient
          .from("conversations")
          .select("id, type")
          .eq("id", otherInConvos[0].conversation_id)
          .eq("type", "direct")
          .maybeSingle();

        if (conv) {
          return new Response(JSON.stringify({ conversationId: conv.id, existing: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Create new conversation
    const { data: conv, error: convError } = await adminClient
      .from("conversations")
      .insert({ type: "direct" })
      .select()
      .single();

    if (convError || !conv) {
      return new Response(JSON.stringify({ error: "Failed to create conversation" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Add BOTH participants using service role
    const { error: partError } = await adminClient
      .from("conversation_participants")
      .insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId },
      ]);

    if (partError) {
      return new Response(JSON.stringify({ error: "Failed to add participants" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ conversationId: conv.id, existing: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
