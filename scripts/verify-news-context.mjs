import assert from 'node:assert/strict';
import {newsContext} from '../lib/news-context.ts';
import {politicalNews} from '../lib/political-news.ts';
for(const item of politicalNews){const result=newsContext(item);if(!result)continue;assert.ok(result.items.length<=3);assert.equal(new Set(result.items.map(n=>n.id)).size,result.items.length);result.items.forEach((n,i)=>{assert.notEqual(n.id,item.id);assert.ok(n.published<item.published);if(i)assert.ok(n.published>=result.items[i-1].published)});assert.deepEqual(result,newsContext(item,[...politicalNews].reverse()));}
assert.equal(newsContext({...politicalNews[0],title:'Nesúvisiaca udalosť'}),null);
assert.equal(newsContext(politicalNews[0],[]),null);
console.log('PASS news context: existing earlier stories only, bounded chronological retrieval, deterministic, no self-links or invented text.');
