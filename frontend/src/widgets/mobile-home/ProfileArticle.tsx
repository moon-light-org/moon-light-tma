import { ChevronLeft } from "lucide-react";

export type ProfileArticleKind = "privacy" | "terms" | "about";

export function ProfileArticle({ kind, onBack }: { kind: ProfileArticleKind; onBack: () => void }) {
  return (
    <div className="profile-article">
      <button type="button" className="profile-article__back" onClick={onBack}><ChevronLeft size={18} /> Back</button>
      <article className="profile-article__body">
        {kind === "privacy" ? <PrivacyPolicy /> : kind === "terms" ? <TermsOfUse /> : <AboutMoonLight />}
      </article>
    </div>
  );
}

function PrivacyPolicy() {
  return <>
    <h1>Privacy Policy</h1>
    <p className="profile-article__date">Last updated: 19 November 2026</p>
    <h2>The short version</h2>
    <ul>
      <li>MoonLight uses your Telegram account to sign you in and your nickname to identify your contributions.</li>
      <li>We ask for precise location only when you choose a nearby search, open the map, or check in. We use it for that request; check-ins store the place and time, not your GPS coordinates.</li>
      <li>Reviews and place contributions can be seen by other people. Please do not include private information in them.</li>
      <li>When precise location is unavailable, the server may use an approximate location supplied by its hosting provider to suggest places.</li>
    </ul>
    <h2>What we collect</h2>
    <p>Your account stores your Telegram ID, nickname, optional avatar URL, role, and creation date. We store places you submit, reviews, reports, and check-ins. A check-in records the place, account, and time. Reviews may include a rating, payment details, and text you provide.</p>
    <h2>How we use it</h2>
    <p>We use account data to sign you in, show your profile, moderate contributions, and prevent duplicate check-ins. Location coordinates sent for nearby suggestions or check-in validation are processed for those requests. Approved places, review text, and reviewer nicknames may appear in the app.</p>
    <h2>Where it goes</h2>
    <p>MoonLight runs inside Telegram. Its API is hosted on Vercel, and app data and place images are stored in Supabase. The map also loads tiles from OpenFreeMap. Those services may receive the technical information needed to serve your requests.</p>
    <h2>Your choices</h2>
    <p>You can change your nickname in Profile. You can browse general suggestions without sharing precise location. Account deletion is not yet available in the app; the Delete account menu item will remain unavailable until that flow exists.</p>
  </>;
}

function TermsOfUse() {
  return <>
    <h1>Terms of Use</h1>
    <p className="profile-article__date">Last updated: 19 November 2026</p>
    <h2>The short version</h2>
    <ul>
      <li>MoonLight is a community map of places that may accept Bitcoin.</li>
      <li>Check with the merchant before travelling or paying. Listings and payment details can change.</li>
      <li>Only add real places and write reviews based on your own experience.</li>
      <li>MoonLight does not handle your payments or provide financial advice.</li>
    </ul>
    <h2>Your account and contributions</h2>
    <p>You use MoonLight through Telegram and choose a nickname for your profile. Please do not impersonate others or post private information. Content you submit may be displayed in the app and reviewed by moderators. We may remove inaccurate or abusive submissions.</p>
    <h2>Not allowed</h2>
    <ul>
      <li>Fake places, misleading payment information, or reviews you did not earn through a real visit</li>
      <li>Harassment, hate speech, illegal content, or another person's private information</li>
      <li>Spam, bots, scraping, or attempts to manipulate activity and rankings</li>
      <li>Attacks on the service or attempts to bypass its checks</li>
    </ul>
    <h2>Payments and map information</h2>
    <p>Any payment is between you and the merchant. MoonLight does not operate a wallet or process transactions. Community and imported map data can be incomplete or wrong; verify important details directly with the place.</p>
    <h2>Availability</h2>
    <p>We may update or remove content and change the service as it develops. We cannot guarantee that every listing, review, or feature will always be available or accurate.</p>
  </>;
}

function AboutMoonLight() {
  return <>
    <h1>About MoonLight</h1>
    <p className="profile-article__lead">A community map of places that welcome Bitcoin.</p>
    <p><strong>Money can be spent. Bitcoin can, too.</strong> MoonLight helps you find places to use it in everyday life, starting with food and expanding across other kinds of businesses.</p>
    <h2>Why this map exists</h2>
    <p>Finding a place that accepts Bitcoin should be simple. MoonLight brings places, payment details, and community updates together so you can decide where to go.</p>
    <h2>How the community helps</h2>
    <ul>
      <li>Check-ins show recent visits to a place.</li>
      <li>Reviews share what happened and how people paid.</li>
      <li>Reports flag listings that need another look.</li>
    </ul>
    <p>Details can change, so always confirm with the merchant before visiting or paying.</p>
    <h2>Build the guide together</h2>
    <p>Add a missing place, check in when you visit, or leave a useful review. Each contribution helps keep the map current for the next person.</p>
  </>;
}
