import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null as any;

const app = express();
app.use(express.json());

// Middleware to check if Supabase is configured
app.use("/api", (req, res, next) => {
  if (!supabase && req.path !== "/health") {
    console.error("Supabase not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    return res.status(503).json({ 
      error: "Servidor não configurado. Por favor, adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do AI Studio (Menu Settings)." 
    });
  }
  next();
});

// Request logger
app.use("/api", (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Securely resolve tenant_id
app.use("/api", async (req, res, next) => {
  if (req.path === "/login" || req.path === "/health") {
    return next();
  }
  
  const userId = req.headers['x-user-id'];
  if (!userId) {
    console.warn(`Auth Middleware: Missing x-user-id header for path ${req.path}`);
    return res.status(401).json({ error: "Usuário não autenticado" });
  }
  
  const { data: user, error: userErr } = await supabase.from('app_users').select('tenant_id, is_super_admin').eq('id', userId).single();
  
  if (userErr || !user) {
    console.error(`Auth Middleware Error for userId ${userId}:`, userErr || "User not found");
    return res.status(401).json({ error: "Usuário não encontrado" });
  }
  
  (req as any).tenant_id = user.tenant_id;
  (req as any).is_super_admin = user.is_super_admin;
  
  next();
});

// Helper to get tenant_id from request
const getTenantId = (req: express.Request) => {
  return (req as any).tenant_id || null;
};

// --- API Routes ---

// Bootstrap Super Admin
const bootstrapAdmin = async () => {
  if (!supabase) return;
  try {
    // Check for existing super admin 'felipe'
    // We use limit(1) to avoid errors if multiple exist due to previous bugs
    const { data: existing, error: checkError } = await supabase
      .from("app_users")
      .select("id")
      .eq("username", "felipe")
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("Bootstrap check error:", checkError);
      return;
    }

    if (!existing) {
      console.log("Bootstrapping super admin 'felipe'...");
      // Try to find the first tenant to associate with, or leave null
      const { data: firstTenant } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
      
      const { error: insertError } = await supabase.from("app_users").insert([{
        tenant_id: firstTenant?.id || null,
        username: "felipe",
        password: "260892",
        name: "Felipe Super Admin",
        role: "admin",
        is_super_admin: true
      }]);
      
      if (insertError) {
        console.error("Bootstrap insert error:", insertError);
      }
    }
  } catch (err) {
    console.error("Bootstrap unexpected error:", err);
  }
};
bootstrapAdmin();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase não configurado" });
    }

    // Use limit(1) to handle cases where multiple users might exist with same username/password
    // (e.g. if bootstrap ran multiple times without tenant_id)
    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, username, role, name, tenant_id, is_super_admin")
      .eq("username", username)
      .eq("password", password)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Supabase Login Error:", error);
      throw error;
    }

    if (user) {
      console.log(`Login successful for user: ${username} (ID: ${user.id})`);
      res.json(user);
    } else {
      console.warn(`Login failed for user: ${username}`);
      res.status(401).json({ error: "Usuário ou senha inválidos" });
    }
  } catch (err: any) {
    console.error("Login Route Error:", err);
    res.status(500).json({ 
      error: "Erro interno no servidor", 
      details: err.message,
      code: err.code,
      hint: err.hint
    });
  }
});

// Tenant Management
app.get("/api/tenants", async (req, res) => {
  if (!(req as any).is_super_admin) return res.status(403).json({ error: "Acesso negado" });
  const { data, error } = await supabase.from("tenants").select("*").order("name");
  res.json(data || []);
});

app.post("/api/tenants", async (req, res) => {
  if (!(req as any).is_super_admin) return res.status(403).json({ error: "Acesso negado" });
  const { name, slug, admin_username, admin_password, admin_name } = req.body;
  const { data: tenant, error: tErr } = await supabase.from("tenants").insert([{ name, slug }]).select().single();
  if (tErr) return res.status(400).json({ error: tErr.message });
  const { error: uErr } = await supabase.from("app_users").insert([{
    tenant_id: tenant.id, username: admin_username, password: admin_password, name: admin_name, role: 'admin'
  }]);
  if (uErr) return res.status(400).json({ error: uErr.message });
  res.json({ success: true, tenantId: tenant.id });
});

app.patch("/api/tenants/:id/status", async (req, res) => {
  if (!(req as any).is_super_admin) return res.status(403).json({ error: "Acesso negado" });
  const { status } = req.body;
  await supabase.from("tenants").update({ status }).eq("id", req.params.id);
  res.json({ success: true });
});

app.put("/api/tenants/:id", async (req, res) => {
  if (!(req as any).is_super_admin) return res.status(403).json({ error: "Acesso negado" });
  const { name, slug, status } = req.body;
  const { error } = await supabase.from("tenants").update({ name, slug, status }).eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/tenants/:id", async (req, res) => {
  if (!(req as any).is_super_admin) return res.status(403).json({ error: "Acesso negado" });
  const { error } = await supabase.from("tenants").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// User Management
app.get("/api/admin/users", async (req, res) => {
  const { data, error } = await supabase.from("app_users").select("*, tenants:tenant_id (name)").order("name");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

app.put("/api/admin/users/:id", async (req, res) => {
  const { name, username, password, role, tenant_id, is_super_admin } = req.body;
  const updateData: any = { name, username, role, tenant_id, is_super_admin };
  if (password) updateData.password = password;
  const { error } = await supabase.from("app_users").update(updateData).eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/admin/users/:id", async (req, res) => {
  const { error } = await supabase.from("app_users").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Cash Flow
app.get("/api/cash-flow/current", async (req, res) => {
  const tenant_id = getTenantId(req);
  if (!tenant_id) return res.status(400).json({ error: "Tenant ID missing" });
  const { data } = await supabase.from("cash_flow").select("*").eq("tenant_id", tenant_id).eq("status", "open").order("opened_at", { ascending: false }).limit(1).maybeSingle();
  res.json(data || null);
});

app.post("/api/cash-flow/open", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { user_id, initial_value } = req.body;
  const { data, error } = await supabase.from("cash_flow").insert([{ tenant_id, user_id, initial_value, status: "open" }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id });
});

app.post("/api/cash-flow/close", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { id, final_value } = req.body;
  const { data: session } = await supabase.from("cash_flow").select("*").eq("id", id).eq("tenant_id", tenant_id).single();
  if (!session) return res.status(404).json({ error: "Sessão não encontrada" });
  const { data: sales } = await supabase.from("sales").select("total_amount").eq("tenant_id", tenant_id).gte("created_at", session.opened_at);
  const salesTotal = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
  const expected = Number(session.initial_value) + salesTotal;
  const { error } = await supabase.from("cash_flow").update({ closed_at: new Date().toISOString(), final_value, expected_value: expected, status: "closed" }).eq("id", id).eq("tenant_id", tenant_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Settings
app.get("/api/settings", async (req, res) => {
  const tenant_id = getTenantId(req);
  const userId = req.headers['x-user-id'];
  
  // Get tenant settings
  const { data: tenantSettings } = await supabase.from("settings").select("*").eq("tenant_id", tenant_id).is("user_id", null);
  
  // Get user specific settings (preferences)
  const { data: userSettings } = await supabase.from("settings").select("*").eq("tenant_id", tenant_id).eq("user_id", userId);
  
  const settingsObj = [...(tenantSettings || []), ...(userSettings || [])].reduce((acc: any, curr: any) => { 
    acc[curr.key] = curr.value; 
    return acc; 
  }, {}) || {};
  
  res.json(settingsObj);
});

app.post("/api/settings", async (req, res) => {
  const tenant_id = getTenantId(req);
  const userId = req.headers['x-user-id'];
  const settings = req.body;
  
  try {
    for (const [key, value] of Object.entries(settings)) {
      const userSpecificKeys = ['theme', 'primary_color', 'sidebar_collapsed'];
      const isUserSpecific = userSpecificKeys.includes(key);
      
      const query = supabase.from("settings")
        .select("id")
        .eq("tenant_id", tenant_id)
        .eq("key", key);
      
      if (isUserSpecific) {
        query.eq("user_id", userId);
      } else {
        query.is("user_id", null);
      }
      
      const { data: existing } = await query.maybeSingle();
      
      if (existing) {
        await supabase.from("settings")
          .update({ value: String(value) })
          .eq("id", existing.id);
      } else {
        await supabase.from("settings")
          .insert([{
            tenant_id,
            user_id: isUserSpecific ? userId : null,
            key,
            value: String(value)
          }]);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Settings Update Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Products
app.get("/api/products", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data } = await supabase.from("products").select("*, suppliers(name)").eq("tenant_id", tenant_id).order("name");
  const products = data?.map((p: any) => ({ ...p, supplier_name: p.suppliers?.name })) || [];
  res.json(products);
});

app.post("/api/products", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { name, barcode, category, price, cost_price, stock_quantity, min_stock_level, supplier_id, image_url } = req.body;
  
  const productData = {
    tenant_id,
    name,
    barcode,
    category,
    price: Number(price),
    cost_price: cost_price ? Number(cost_price) : null,
    stock_quantity: Number(stock_quantity || 0),
    min_stock_level: Number(min_stock_level || 0),
    supplier_id: supplier_id ? Number(supplier_id) : null,
    image_url
  };

  const { data, error } = await supabase.from("products").insert([productData]).select().single();
  if (error) {
    console.error("Error creating product:", error);
    return res.status(400).json({ error: error.message });
  }
  res.json({ id: data.id });
});

app.put("/api/products/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { name, barcode, category, price, cost_price, stock_quantity, min_stock_level, supplier_id, image_url } = req.body;
  
  const productData = {
    name,
    barcode,
    category,
    price: Number(price),
    cost_price: cost_price ? Number(cost_price) : null,
    stock_quantity: Number(stock_quantity || 0),
    min_stock_level: Number(min_stock_level || 0),
    supplier_id: supplier_id ? Number(supplier_id) : null,
    image_url
  };

  const { error } = await supabase.from("products").update(productData).eq("id", req.params.id).eq("tenant_id", tenant_id);
  if (error) {
    console.error("Error updating product:", error);
    return res.status(400).json({ error: error.message });
  }
  res.json({ success: true });
});

app.delete("/api/products/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { error } = await supabase.from("products").delete().eq("id", req.params.id).eq("tenant_id", tenant_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Batches
app.get("/api/batches", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data, error } = await supabase.from("batches").select("*, products(name)").eq("tenant_id", tenant_id).order("expiry_date", { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  const batches = data?.map((b: any) => ({ ...b, product_name: b.products?.name })) || [];
  res.json(batches);
});

app.post("/api/batches", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { product_id, quantity, expiry_date } = req.body;
  
  try {
    const { data: batch, error: batchErr } = await supabase.from("batches").insert([{ 
      tenant_id, 
      product_id: Number(product_id), 
      quantity: Number(quantity), 
      expiry_date 
    }]).select().single();
    
    if (batchErr) throw batchErr;
    
    // Update product stock
    const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", product_id).eq("tenant_id", tenant_id).single();
    const newStock = (product?.stock_quantity || 0) + Number(quantity);
    await supabase.from("products").update({ stock_quantity: newStock }).eq("id", product_id).eq("tenant_id", tenant_id);
    
    res.json({ id: batch.id });
  } catch (err: any) {
    console.error("Error creating batch:", err);
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/batches/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  try {
    const { data: batch } = await supabase.from("batches").select("*").eq("id", req.params.id).eq("tenant_id", tenant_id).single();
    if (batch) {
      const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", batch.product_id).eq("tenant_id", tenant_id).single();
      const newStock = Math.max(0, (product?.stock_quantity || 0) - Number(batch.quantity));
      await supabase.from("products").update({ stock_quantity: newStock }).eq("id", batch.product_id).eq("tenant_id", tenant_id);
      await supabase.from("batches").delete().eq("id", req.params.id).eq("tenant_id", tenant_id);
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting batch:", err);
    res.status(400).json({ error: err.message });
  }
});

// Suppliers
app.get("/api/suppliers", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data } = await supabase.from("suppliers").select("*").eq("tenant_id", tenant_id).order("name");
  res.json(data || []);
});

app.post("/api/suppliers", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { name, cnpj, contact, phone, email } = req.body;
  const { data, error } = await supabase.from("suppliers").insert([{ tenant_id, name, cnpj, contact, phone, email }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id });
});

app.put("/api/suppliers/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { name, cnpj, contact, phone, email } = req.body;
  const { error } = await supabase.from("suppliers").update({ name, cnpj, contact, phone, email }).eq("id", req.params.id).eq("tenant_id", tenant_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/suppliers/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { error } = await supabase.from("suppliers").delete().eq("id", req.params.id).eq("tenant_id", tenant_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Accounts Payable
app.get("/api/accounts-payable", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data } = await supabase.from("accounts_payable").select("*, suppliers(name)").eq("tenant_id", tenant_id).order("due_date", { ascending: true });
  const bills = data?.map((b: any) => ({ ...b, supplier_name: b.suppliers?.name })) || [];
  res.json(bills);
});

app.post("/api/accounts-payable", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { description, amount, due_date, category, supplier_id, is_recurring } = req.body;
  const { data, error } = await supabase.from("accounts_payable").insert([{ 
    tenant_id, 
    description, 
    amount: Number(amount), 
    due_date, 
    category, 
    supplier_id: supplier_id ? Number(supplier_id) : null, 
    is_recurring: !!is_recurring 
  }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id });
});

app.patch("/api/accounts-payable/:id/pay", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data: bill } = await supabase.from("accounts_payable").select("*").eq("id", req.params.id).eq("tenant_id", tenant_id).single();
  if (!bill) return res.status(404).json({ error: "Conta não encontrada" });
  await supabase.from("accounts_payable").update({ status: "Pago" }).eq("id", req.params.id).eq("tenant_id", tenant_id);
  if (bill.is_recurring) {
    const dueDate = new Date(bill.due_date);
    dueDate.setMonth(dueDate.getMonth() + 1);
    await supabase.from("accounts_payable").insert([{ tenant_id, description: bill.description, amount: bill.amount, due_date: dueDate.toISOString().split('T')[0], category: bill.category, supplier_id: bill.supplier_id, is_recurring: true }]);
  }
  res.json({ success: true });
});

app.delete("/api/accounts-payable/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  await supabase.from("accounts_payable").delete().eq("id", req.params.id).eq("tenant_id", tenant_id);
  res.json({ success: true });
});

// Customers
app.get("/api/customers", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data } = await supabase.from("customers").select("*").eq("tenant_id", tenant_id).order("name");
  res.json(data || []);
});

app.post("/api/customers", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { name, email, phone, document } = req.body;
  const { data, error } = await supabase.from("customers").insert([{ tenant_id, name, email, phone, document }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id });
});

app.put("/api/customers/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { name, email, phone, document } = req.body;
  const { error } = await supabase.from("customers").update({ name, email, phone, document }).eq("id", req.params.id).eq("tenant_id", tenant_id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/customers/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  await supabase.from("customers").delete().eq("id", req.params.id).eq("tenant_id", tenant_id);
  res.json({ success: true });
});

// Inventory Logs
app.get("/api/inventory-logs", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data } = await supabase.from("inventory_logs").select("*, products(name), app_users(name)").eq("tenant_id", tenant_id).order("created_at", { ascending: false }).limit(100);
  const logs = data?.map((l: any) => ({ ...l, product_name: l.products?.name, user_name: l.app_users?.name })) || [];
  res.json(logs);
});

app.post("/api/inventory-logs", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { product_id, user_id, change_amount, reason } = req.body;
  const { data, error } = await supabase.from("inventory_logs").insert([{ 
    tenant_id, 
    product_id: Number(product_id), 
    user_id: Number(user_id), 
    change_amount: Number(change_amount), 
    reason 
  }]).select().single();
  if (error) return res.status(400).json({ error: error.message });
  const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", product_id).eq("tenant_id", tenant_id).single();
  const newStock = (product?.stock_quantity || 0) + Number(change_amount);
  await supabase.from("products").update({ stock_quantity: newStock }).eq("id", product_id).eq("tenant_id", tenant_id);
  res.json({ id: data.id });
});

// Sales
app.get("/api/sales", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data } = await supabase.from("sales").select("*, customers(name)").eq("tenant_id", tenant_id).order("created_at", { ascending: false });
  const sales = data?.map((s: any) => ({ ...s, customer_name: s.customers?.name })) || [];
  res.json(sales);
});

app.get("/api/sales/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data: sale } = await supabase.from("sales").select("*, customers(name, phone)").eq("id", req.params.id).eq("tenant_id", tenant_id).single();
  if (!sale) return res.status(404).json({ error: "Venda não encontrada" });
  const { data: items } = await supabase.from("sale_items").select("*, products(name)").eq("sale_id", req.params.id).eq("tenant_id", tenant_id);
  const formattedItems = items?.map((i: any) => ({ ...i, product_name: i.products?.name })) || [];
  res.json({ ...sale, customer_name: (sale as any).customers?.name, customer_phone: (sale as any).customers?.phone, items: formattedItems });
});

app.post("/api/sales", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { customer_id, items, total_amount, discount, payment_method, payments } = req.body;
  
  // Use payments if provided, otherwise fallback to payment_method
  const finalPaymentMethod = payments ? JSON.stringify(payments) : payment_method;

  const { data: sale, error: saleErr } = await supabase.from("sales").insert([{ 
    tenant_id, 
    customer_id: customer_id ? Number(customer_id) : null, 
    total_amount: Number(total_amount), 
    discount: Number(discount || 0), 
    payment_method: finalPaymentMethod
  }]).select().single();
  
  if (saleErr) return res.status(400).json({ error: saleErr.message });
  
  for (const item of items) {
    await supabase.from("sale_items").insert([{ 
      tenant_id, 
      sale_id: sale.id, 
      product_id: Number(item.product_id || item.id), 
      quantity: Number(item.quantity), 
      unit_price: Number(item.unit_price || item.price), 
      discount: Number(item.discount || 0) 
    }]);
    const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id || item.id).eq("tenant_id", tenant_id).single();
    const newStock = (product?.stock_quantity || 0) - Number(item.quantity);
    await supabase.from("products").update({ stock_quantity: newStock }).eq("id", item.product_id || item.id).eq("tenant_id", tenant_id);
  }
  
  if (customer_id) {
    const { data: customer } = await supabase.from("customers").select("points").eq("id", customer_id).eq("tenant_id", tenant_id).single();
    const newPoints = (customer?.points || 0) + Math.floor(Number(total_amount) / 10);
    await supabase.from("customers").update({ points: newPoints }).eq("id", customer_id).eq("tenant_id", tenant_id);
  }
  
  res.json({ success: true, saleId: sale.id });
});

app.put("/api/sales/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { customer_id, items, total_amount, discount, payment_method, payments } = req.body;
  const saleId = req.params.id;

  try {
    // 1. Get old items to revert stock
    const { data: oldItems } = await supabase.from("sale_items").select("*").eq("sale_id", saleId).eq("tenant_id", tenant_id);
    
    if (oldItems) {
      for (const item of oldItems) {
        const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).eq("tenant_id", tenant_id).single();
        const revertedStock = (product?.stock_quantity || 0) + Number(item.quantity);
        await supabase.from("products").update({ stock_quantity: revertedStock }).eq("id", item.product_id).eq("tenant_id", tenant_id);
      }
    }

    // 2. Delete old items
    await supabase.from("sale_items").delete().eq("sale_id", saleId).eq("tenant_id", tenant_id);

    // 3. Update sale record
    const finalPaymentMethod = payments ? JSON.stringify(payments) : payment_method;
    const { error: saleErr } = await supabase.from("sales").update({
      customer_id: customer_id ? Number(customer_id) : null,
      total_amount: Number(total_amount),
      discount: Number(discount || 0),
      payment_method: finalPaymentMethod
    }).eq("id", saleId).eq("tenant_id", tenant_id);

    if (saleErr) throw saleErr;

    // 4. Insert new items and update stock
    for (const item of items) {
      await supabase.from("sale_items").insert([{ 
        tenant_id, 
        sale_id: Number(saleId), 
        product_id: Number(item.product_id || item.id), 
        quantity: Number(item.quantity), 
        unit_price: Number(item.unit_price || item.price), 
        discount: Number(item.discount || 0) 
      }]);
      const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id || item.id).eq("tenant_id", tenant_id).single();
      const newStock = (product?.stock_quantity || 0) - Number(item.quantity);
      await supabase.from("products").update({ stock_quantity: newStock }).eq("id", item.product_id || item.id).eq("tenant_id", tenant_id);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error updating sale:", err);
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/sales/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data: sale } = await supabase.from("sales").select("*").eq("id", req.params.id).eq("tenant_id", tenant_id).single();
  if (!sale) return res.status(404).json({ error: "Venda não encontrada" });
  const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", req.params.id).eq("tenant_id", tenant_id);
  for (const item of items || []) {
    const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).eq("tenant_id", tenant_id).single();
    const newStock = (product?.stock_quantity || 0) + Number(item.quantity);
    await supabase.from("products").update({ stock_quantity: newStock }).eq("id", item.product_id).eq("tenant_id", tenant_id);
  }
  if (sale.customer_id) {
    const { data: customer } = await supabase.from("customers").select("points").eq("id", sale.customer_id).eq("tenant_id", tenant_id).single();
    const newPoints = Math.max(0, (customer?.points || 0) - Math.floor(sale.total_amount / 10));
    await supabase.from("customers").update({ points: newPoints }).eq("id", sale.customer_id).eq("tenant_id", tenant_id);
  }
  await supabase.from("sale_items").delete().eq("sale_id", req.params.id).eq("tenant_id", tenant_id);
  await supabase.from("sales").delete().eq("id", req.params.id).eq("tenant_id", tenant_id);
  res.json({ success: true });
});

// Stats
app.get("/api/stats", async (req, res) => {
  const tenant_id = getTenantId(req);
  try {
    const { data: allSales } = await supabase.from("sales").select("total_amount, created_at").eq("tenant_id", tenant_id);
    const totalRevenue = allSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = allSales?.filter(s => s.created_at.startsWith(today)).reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
    const { count: lowStockCount } = await supabase.from("products").select("*", { count: 'exact', head: true }).eq("tenant_id", tenant_id).lte("stock_quantity", "min_stock_level");
    const { data: saleItems } = await supabase.from("sale_items").select("quantity, products(name)").eq("tenant_id", tenant_id);
    const productSales: any = {};
    saleItems?.forEach((item: any) => {
      const name = item.products?.name;
      if (name) productSales[name] = (productSales[name] || 0) + item.quantity;
    });
    const topProducts = Object.entries(productSales).map(([name, total_sold]) => ({ name, total_sold })).sort((a: any, b: any) => b.total_sold - a.total_sold).slice(0, 5);
    res.json({ totalRevenue, todayRevenue, lowStockCount: lowStockCount || 0, topProducts });
  } catch (err: any) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Erro ao carregar estatísticas" });
  }
});

export default app;
