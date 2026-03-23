const AdminPreview = () => (
  <div>
    <h2 className="font-display text-2xl font-bold mb-6">Preview da Landing Page</h2>
    <div className="glass p-2 rounded-xl overflow-hidden">
      <iframe
        src="/"
        className="w-full rounded-lg"
        style={{ height: "80vh" }}
        title="Preview da Landing Page"
      />
    </div>
    <p className="text-xs text-muted-foreground mt-3">* Salve as alterações e recarregue o preview para ver as mudanças</p>
  </div>
);

export default AdminPreview;
