export default function RootRedirect() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var match = document.cookie.match(/(?:^|; )syntsch_lang=([^;]*)/);
            var lang = match ? decodeURIComponent(match[1]) : "en";
            if (lang !== "en" && lang !== "de" && lang !== "ru") lang = "en";
            window.location.replace("/" + lang + "/");
          })();
        `,
      }}
    />
  );
}
