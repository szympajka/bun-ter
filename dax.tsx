import { Button as TButton } from './components/ui/button';

export const Button = ({ onClick }: { onClick: () => void }) => {
  return <TButton onClick={onClick}>Click me</TButton>;
}