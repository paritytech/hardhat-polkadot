import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DEFAULT_GREETING = "Hi there!";

const GreeterModule = buildModule("GreeterModule", (m) => {
    console.log("GreeterModule is being built");
    const greeting = m.getParameter("greeting", DEFAULT_GREETING);
    
    const greeter = m.contract("Greeter", [greeting]);
    
    return { greeter };
});

export default GreeterModule;