interface WelcomeMessageProps {
  message: string;
}

export function WelcomeMessage({ message }: WelcomeMessageProps) {
  return (
    <p className="max-w-prose border-l-2 border-primary pl-5 text-xl leading-relaxed text-pretty italic">
      {message}
    </p>
  );
}
