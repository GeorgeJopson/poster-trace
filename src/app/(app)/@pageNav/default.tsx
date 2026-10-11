// Every page under (app) needs a matching @pageNav page, even one that
// renders nothing: on client-side navigation a slot with no match keeps
// showing its previous content. This default only covers full page loads.
export default function DefaultPageNav() {
  return null;
}
