import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const DEFAULT_GREETING = 'Hi there!';

// hardhat ignition deploy ./ignition/modules/Greeter.ts
const GreeterModule = buildModule('GreeterModule', (m) => {
    const greeting = m.getParameter('greeting', DEFAULT_GREETING);

    const greeter = m.contract('Greeter', [greeting]);

    return { greeter };
});

export default GreeterModule;
