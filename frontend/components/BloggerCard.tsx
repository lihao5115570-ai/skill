type BloggerCardProps = {
  name: string;
};

export default function BloggerCard({ name }: BloggerCardProps) {
  return (
    <article className="panel">
      <h2>{name}</h2>
      <p className="muted">匹配理由和代表妆容会在博主匹配 API 完成后展示。</p>
    </article>
  );
}

