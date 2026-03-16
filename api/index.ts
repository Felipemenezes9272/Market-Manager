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
    return res.status(401).json({ error: "Usuário não autenticado" });
  }
  
  const { data: user, error: userErr } = await supabase.from('app_users').select('tenant_id, is_super_admin').eq('id', userId).single();
  
  if (userErr || !user) {
    console.error("Auth Middleware Error:", userErr || "User not found");
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, username, role, name, tenant_id, is_super_admin")
      .eq("username", username)
      .eq("password", password)
      .maybeSingle();

    if (error) throw error;
    if (user) {
      console.log(`Login successful for user: ${username}`);
      res.json(user);
    } else {
      console.warn(`Login failed for user: ${username}`);
      res.status(401).json({ error: "Usuário ou senha inválidos" });
    }
  } catch (err: any) {
    console.error("Login Route Error:", err);
    res.status(500).json({ error: "Erro interno no servidor", details: err.message });
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
  const { status } = req.body;
  await supabase.from("tenants").update({ status }).eq("id", req.params.id);
  res.json({ success: true });
});

app.put("/api/tenants/:id", async (req, res) => {
  const { name, slug } = req.body;
  const { error } = await supabase.from("tenants").update({ name, slug }).eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

app.delete("/api/tenants/:id", async (req, res) => {
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
  const { data: settings } = await supabase.from("settings").select("*").eq("tenant_id", tenant_id);
  const settingsObj = settings?.reduce((acc: any, curr: any) => { acc[curr.key] = curr.value; return acc; }, {}) || {};
  res.json(settingsObj);
});

app.post("/api/settings", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { key, value } = req.body;
  const { error } = await supabase.from("settings").upsert({ tenant_id, key, value: String(value) });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
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
  const { data } = await supabase.from("batches").select("*, products(name)").eq("tenant_id", tenant_id).order("expiry_date", { ascending: true });
  const batches = data?.map((b: any) => ({ ...b, product_name: b.products?.name })) || [];
  res.json(batches);
});

app.post("/api/batches", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { product_id, quantity, expiry_date } = req.body;
  const { data: batch, error: batchErr } = await supabase.from("batches").insert([{ tenant_id, product_id, quantity, expiry_date }]).select().single();
  if (batchErr) return res.status(400).json({ error: batchErr.message });
  const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", product_id).eq("tenant_id", tenant_id).single();
  const newStock = (product?.stock_quantity || 0) + Number(quantity);
  await supabase.from("products").update({ stock_quantity: newStock }).eq("id", product_id).eq("tenant_id", tenant_id);
  res.json({ id: batch.id });
});

app.delete("/api/batches/:id", async (req, res) => {
  const tenant_id = getTenantId(req);
  const { data: batch } = await supabase.from("batches").select("*").eq("id", req.params.id).eq("tenant_id", tenant_id).single();
  if (batch) {
    const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", batch.product_id).eq("tenant_id", tenant_id).single();
    const newStock = (product?.stock_quantity || 0) - Number(batch.quantity);
    await supabase.from("products").update({ stock_quantity: newStock }).eq("id", batch.product_id).eq("tenant_id", tenant_id);
    await supabase.from("batches").delete().eq("id", req.params.id).eq("tenant_id", tenant_id);
  }
  res.json({ success: true });
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
  const { customer_id, items, total_amount, discount, payment_method } = req.body;
  const { data: sale, error: saleErr } = await supabase.from("sales").insert([{ 
    tenant_id, 
    customer_id: customer_id ? Number(customer_id) : null, 
    total_amount: Number(total_amount), 
    discount: Number(discount || 0), 
    payment_method 
  }]).select().single();
  if (saleErr) return res.status(400).json({ error: saleErr.message });
  for (const item of items) {
    await supabase.from("sale_items").insert([{ 
      tenant_id, 
      sale_id: sale.id, 
      product_id: Number(item.product_id), 
      quantity: Number(item.quantity), 
      unit_price: Number(item.unit_price), 
      discount: Number(item.discount || 0) 
    }]);
    const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).eq("tenant_id", tenant_id).single();
    const newStock = (product?.stock_quantity || 0) - Number(item.quantity);
    await supabase.from("products").update({ stock_quantity: newStock }).eq("id", item.product_id).eq("tenant_id", tenant_id);
  }
  if (customer_id) {
    const { data: customer } = await supabase.from("customers").select("points").eq("id", customer_id).eq("tenant_id", tenant_id).single();
    const newPoints = (customer?.points || 0) + Math.floor(Number(total_amount) / 10);
    await supabase.from("customers").update({ points: newPoints }).eq("id", customer_id).eq("tenant_id", tenant_id);
  }
  res.json({ success: true, saleId: sale.id });
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
});

export default app;
