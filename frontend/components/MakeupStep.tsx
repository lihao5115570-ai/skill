type MakeupStepProps = {
  order: number;
  title: string;
};

export default function MakeupStep({ order, title }: MakeupStepProps) {
  return (
    <article className="panel step-row">
      <span className="step-number">{order}</span>
      <div>
        <h2>{title}</h2>
        <p className="muted">后续补充具体操作、产品类型和避坑说明。</p>
      </div>
    </article>
  );
}

