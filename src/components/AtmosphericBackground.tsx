export default function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#0f0d0c]">
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-orange-900/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-amber-900/20 blur-[130px] rounded-full" />
    </div>
  );
}
