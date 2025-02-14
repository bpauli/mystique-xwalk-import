import { expect } from 'chai';
import { replaceJcrRoot } from '../src/utils/helpers.js';

describe('Utils - replaceJcrRoot', () => {
  it('should replace jcr:root with the provided nodeName in opening and closing tags', () => {
    const inputXml = `
      <?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent">
    <root jcr:primaryType="nt:unstructured" sling:resourceType="core/franklin/components/root/v1/root">
      <section sling:resourceType="core/franklin/components/section/v1/section" jcr:primaryType="nt:unstructured">
        <text sling:resourceType="core/franklin/components/text/v1/text" jcr:primaryType="nt:unstructured" text="&lt;p&gt;Hello, world.&lt;/p&gt;"/>
      </section>
    </root>
  </jcr:content>
</jcr:root>
    `;
    const nodeName = 'myNode';
    const result = replaceJcrRoot(inputXml, nodeName);

    expect(result).to.contain(`<${nodeName}`);
    expect(result).to.contain(`</${nodeName}>`);
    expect(result).to.not.contain('jcr:root');
  });
});
