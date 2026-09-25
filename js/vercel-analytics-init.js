// Colas de Vercel Speed Insights (si) y Web Analytics (va): guardan los
// eventos hasta que carguen sus scripts (/_vercel/...). Van en un archivo
// aparte (no inline) para que la Content-Security-Policy no tenga que
// permitir scripts inline.
window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
