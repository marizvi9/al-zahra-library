import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import AuthorAvatar, { shortCreator } from "@/components/AuthorAvatar";
import { allPhotos } from "@/lib/authorPhotos";

export const metadata: Metadata = {
  title: "Author photo credits",
  description: "Where each author photo on this site comes from, who took it, and its licence.",
};

export default function PhotoCreditsPage() {
  const list = allPhotos().sort((a, b) => a.name.localeCompare(b.name));
  const fromWs = list.filter((x) => x.photo.photoSource === "WikiShia").length;
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Authors", href: "/authors/" }, { label: "Photo credits" }]} />
      <h1>Author photo credits</h1>
      <p className="lede">
        The {list.length} author photos on this site come from Wikimedia Commons{fromWs > 0 && ` (and ${fromWs} from WikiShia)`}, each under a free licence that
        allows reuse with credit. Authors without a verified photo are shown with their initials.
      </p>
      <ul className="credit-list">
        {list.map(({ name, photo }) => (
          <li key={name}>
            <AuthorAvatar name={name} size={48} />
            <div>
              <strong dir="auto">{name}</strong>
              <br />
              <span className="small">
                Photo by <a href={photo.source} rel="noopener">{shortCreator(photo.creator)}</a> ·{" "}
                {photo.licenseUrl ? (
                  <a href={photo.licenseUrl} rel="noopener license">
                    {photo.license}
                  </a>
                ) : (
                  photo.license
                )}{" "}
                · <a href={photo.wikipediaUrl} rel="noopener">Wikipedia</a>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
