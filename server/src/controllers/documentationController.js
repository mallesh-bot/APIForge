import Collection from '../models/Collection.js';
import SavedRequest from '../models/SavedRequest.js';

export async function getCollectionDocumentation(req, res, next) {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, ownerId: req.user.id });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const requests = await SavedRequest.find({ collectionId: id, ownerId: req.user.id }).sort({ order: 1, createdAt: 1 });

    const endpoints = requests.map((r) => {
      // Redact auth credentials for documentation safety
      let authType = 'None';
      if (r.auth && r.auth.type && r.auth.type !== 'none') {
        authType = r.auth.type.toUpperCase();
      }

      return {
        id: r._id,
        name: r.name,
        method: r.method,
        urlTemplate: r.urlTemplate,
        description: r.description || 'No description provided.',
        authType,
        params: (r.params || []).filter((p) => p.key).map((p) => ({ key: p.key, value: p.value })),
        headers: (r.headers || []).filter((h) => h.key && !h.key.toLowerCase().includes('token')).map((h) => ({
          key: h.key,
          value: h.key.toLowerCase() === 'authorization' ? 'Bearer <TOKEN>' : h.value,
        })),
        bodyType: r.body?.type || 'none',
        bodySample: r.body?.content || null,
        assertions: (r.assertions || []).map((a) => ({
          type: a.type,
          field: a.field,
          expected: a.expected,
        })),
      };
    });

    return res.status(200).json({
      success: true,
      documentation: {
        collection: {
          id: collection._id,
          name: collection.name,
          description: collection.description,
          totalEndpoints: endpoints.length,
          generatedAt: new Date().toISOString(),
        },
        endpoints,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportDocumentationMarkdown(req, res, next) {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({ _id: id, ownerId: req.user.id });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const requests = await SavedRequest.find({ collectionId: id, ownerId: req.user.id }).sort({ order: 1, createdAt: 1 });

    let md = `# ${collection.name}\n\n`;
    if (collection.description) {
      md += `> ${collection.description}\n\n`;
    }
    md += `*Generated automatically by APIForge on ${new Date().toLocaleDateString()}*\n\n`;
    md += `**Total Endpoints**: ${requests.length}\n\n---\n\n`;

    requests.forEach((r, idx) => {
      md += `## ${idx + 1}. ${r.name}\n\n`;
      md += `\`${r.method}\` \`${r.urlTemplate}\`\n\n`;

      if (r.description) {
        md += `${r.description}\n\n`;
      }

      if (r.auth && r.auth.type && r.auth.type !== 'none') {
        md += `**Authentication**: \`${r.auth.type.toUpperCase()}\`\n\n`;
      }

      // Query Params
      const validParams = (r.params || []).filter((p) => p.key);
      if (validParams.length > 0) {
        md += `### Query Parameters\n\n`;
        md += `| Parameter | Sample Value |\n|---|---|\n`;
        validParams.forEach((p) => {
          md += `| \`${p.key}\` | \`${p.value}\` |\n`;
        });
        md += `\n`;
      }

      // Headers
      const validHeaders = (r.headers || []).filter((h) => h.key);
      if (validHeaders.length > 0) {
        md += `### Headers\n\n`;
        md += `| Header | Sample Value |\n|---|---|\n`;
        validHeaders.forEach((h) => {
          const val = h.key.toLowerCase() === 'authorization' ? 'Bearer <TOKEN>' : h.value;
          md += `| \`${h.key}\` | \`${val}\` |\n`;
        });
        md += `\n`;
      }

      // Body
      if (r.body && r.body.type !== 'none' && r.body.content) {
        md += `### Request Body (${r.body.type.toUpperCase()})\n\n`;
        md += `\`\`\`json\n${r.body.content}\n\`\`\`\n\n`;
      }

      // Assertions
      if (r.assertions && r.assertions.length > 0) {
        md += `### Automated Assertions\n\n`;
        r.assertions.forEach((a) => {
          md += `- **${a.type}**: ${a.field ? `\`${a.field}\` ` : ''}expected \`${a.expected}\`\n`;
        });
        md += `\n`;
      }

      // Sample cURL
      md += `### Example cURL\n\n`;
      md += `\`\`\`bash\ncurl -X ${r.method} "${r.urlTemplate}"`;
      if (validHeaders.length > 0) {
        validHeaders.forEach((h) => {
          const val = h.key.toLowerCase() === 'authorization' ? 'Bearer <TOKEN>' : h.value;
          md += ` \\\n  -H "${h.key}: ${val}"`;
        });
      }
      if (r.body && r.body.type === 'json' && r.body.content) {
        md += ` \\\n  -d '${r.body.content.replace(/\n/g, ' ')}'`;
      }
      md += `\n\`\`\`\n\n---\n\n`;
    });

    return res.status(200).json({
      success: true,
      markdown: md,
    });
  } catch (err) {
    next(err);
  }
}
