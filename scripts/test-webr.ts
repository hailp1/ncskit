import { WebR } from 'webr';

async function testWebR() {
  console.log('Initializing WebR...');
  const webR = new WebR();
  await webR.init();
  const res = await webR.evalR('R.version.string');
  console.log(await res.toJs());
}

testWebR().catch(console.error);
