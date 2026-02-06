export default function EssayBody({ body }: { body: string }) {
  const paragraphs = body.split("\n\n").filter((p) => p.trim());

  return (
    <div className="space-y-6">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className={`text-lg md:text-xl leading-[1.75] ${
            i === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:leading-[0.8] first-letter:float-left first-letter:mr-2 first-letter:mt-1" : ""
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}
