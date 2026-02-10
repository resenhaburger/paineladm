// CARREGAR CARDÁPIO DINÂMICO
async function carregarCardapio() {
    try {
        const response = await fetch('https://script.google.com/macros/s/SUA_ID/exec?action=getCardapioSite');
        const cardapio = await response.json();
        
        if (cardapio.error) {
            // Fallback para dados locais
            carregarCardapioLocal();
            return;
        }
        
        // Salvar no localStorage para cache
        localStorage.setItem('cardapio_cache', JSON.stringify(cardapio));
        localStorage.setItem('cardapio_cache_time', Date.now());
        
        // Renderizar cardápio
        renderizarCardapio(cardapio.produtos || cardapio);
        
    } catch (error) {
        console.log('Erro ao carregar cardápio, usando cache:', error);
        carregarCardapioLocal();
    }
}

function carregarCardapioLocal() {
    const cache = localStorage.getItem('cardapio_cache');
    const cacheTime = localStorage.getItem('cardapio_cache_time');
    
    // Se cache tem menos de 1 hora, usar
    if (cache && cacheTime && (Date.now() - cacheTime < 3600000)) {
        renderizarCardapio(JSON.parse(cache).produtos || JSON.parse(cache));
    } else {
        // Usar dados embutidos
        renderizarCardapio(dadosCardapio);
    }
}

function renderizarCardapio(produtos) {
    // Agrupar por categoria
    const produtosPorCategoria = {};
    
    produtos.forEach(produto => {
        if (!produtosPorCategoria[produto.Categoria || produto.categoria]) {
            produtosPorCategoria[produto.Categoria || produto.categoria] = [];
        }
        produtosPorCategoria[produto.Categoria || produto.categoria].push(produto);
    });
    
    // Renderizar cada categoria
    Object.keys(produtosPorCategoria).forEach(categoria => {
        const secao = document.getElementById(categoria);
        if (secao) {
            const container = secao.querySelector('.products');
            container.innerHTML = '';
            
            produtosPorCategoria[categoria].forEach(produto => {
                container.appendChild(criarCardProduto(produto));
            });
        }
    });
}

function criarCardProduto(produto) {
    const div = document.createElement('div');
    div.className = 'card';
    
    // Adicionar classes especiais
    if (produto.Destaque || produto.destaque) div.classList.add('destaque');
    if ((produto.Categoria || produto.categoria) === 'combos') div.classList.add('combo');
    if ((produto.Categoria || produto.categoria) === 'premium') div.classList.add('premium-card');
    
    const preco = parseFloat(produto.Preco || produto.preco || 0);
    const nome = produto.Nome || produto.nome || '';
    const ingredientes = produto.Ingredientes || produto.ingredientes || '';
    const descricao = produto.Descricao || produto.descricao || '';
    const imagem = produto.Imagem || produto.imagem || '';
    const tags = (produto.Tags || produto.tags || '').split(',');
    
    div.innerHTML = `
        <div class="card-tag-container">
            ${tags.map(tag => `<span class="card-tag">${tag.trim()}</span>`).join('')}
            ${(produto.Destaque || produto.destaque) ? '<span class="economy-badge">Destaque</span>' : ''}
        </div>
        
        <div class="card-header">
            <h3>${nome}</h3>
            <div class="card-price-container ${preco < 30 ? 'highlight-price' : ''}">
                <span class="card-price">R$ ${preco.toFixed(2).replace('.', ',')}</span>
                ${preco < 30 ? '<span class="card-price-badge"><i class="fas fa-bolt"></i> Preço especial</span>' : ''}
            </div>
        </div>
        
        <div class="card-ingredients">
            <p><strong>Ingredientes:</strong> ${ingredientes}</p>
            ${descricao ? `<p>${descricao}</p>` : ''}
        </div>
        
        <div class="card-actions">
            <button class="add-to-cart pulse-on-hover" onclick="addToCart('${nome.replace(/'/g, "\\'")}', ${preco}, '${produto.Categoria || produto.categoria}')">
                <i class="fas fa-cart-plus"></i> Adicionar
            </button>
        </div>
    `;
    
    return div;
}

// Carregar cardápio quando página carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarCardapio();
    
    // Verificar atualizações a cada 5 minutos
    setInterval(carregarCardapio, 300000);
});