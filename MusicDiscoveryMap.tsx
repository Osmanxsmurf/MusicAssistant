import React, { useEffect, useState, useRef } from 'react';
import { getAIEngine } from '../../lib/ai/ai-api';
import * as d3 from 'd3';

interface MusicMapNode {
  id: string;
  name: string;
  type: 'user' | 'artist' | 'genre' | 'song' | 'mood';
  imageUrl?: string;
  children?: MusicMapNode[];
}

interface MusicMapData {
  center: MusicMapNode;
}

const MusicDiscoveryMap: React.FC = () => {
  const [mapData, setMapData] = useState<MusicMapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  useEffect(() => {
    const fetchDiscoveryMap = async () => {
      try {
        setLoading(true);
        
        // Kullanıcı kimliğini localStorage'dan al
        const userId = localStorage.getItem('musicAssistantUserId') || `user_${Date.now()}`;
        
        // AIAPIHub sınıfının bir örneğini oluştur
        const aiEngine = getAIEngine();
        
        // @ts-ignore: TypeScript hatası - private property
        const apiHub = (aiEngine as any).apiHub;
        
        if (!apiHub) {
          throw new Error('API Hub bulunamadı');
        }
        
        // Keşif haritasını al
        const discoveryMap = await apiHub.createMusicDiscoveryMap(userId);
        setMapData(discoveryMap);
        
      } catch (err) {
        console.error('Müzik keşif haritası yüklenirken hata:', err);
        setError('Müzik keşif haritası yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscoveryMap();
  }, []);
  
  useEffect(() => {
    if (!mapData || !svgRef.current) return;
    
    // D3.js ile müzik haritasını oluştur
    createVisualization();
  }, [mapData, svgRef.current]);
  
  const createVisualization = () => {
    if (!mapData || !svgRef.current) return;
    
    // Mevcut SVG içeriğini temizle
    d3.select(svgRef.current).selectAll('*').remove();
    
    // SVG boyutlarını ayarla
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // SVG elementini seç ve boyutlarını ayarla
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
    
    // Grup elementini oluştur
    const g = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);
    
    // Çember çizgilerini oluştur
    const circleRadii = [50, 150, 250];
    
    circleRadii.forEach(radius => {
      g.append('circle')
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,5');
    });
    
    // Merkez kullanıcı düğümünü oluştur
    g.append('circle')
      .attr('r', 30)
      .attr('fill', '#6366F1')
      .attr('stroke', '#4F46E5')
      .attr('stroke-width', 2);
    
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text(mapData.center.name);
    
    // Çocuk düğümleri oluştur
    if (mapData.center.children && mapData.center.children.length > 0) {
      const children = mapData.center.children;
      const angleStep = (2 * Math.PI) / children.length;
      
      children.forEach((child, i) => {
        const angle = i * angleStep;
        const x = Math.cos(angle) * 150;
        const y = Math.sin(angle) * 150;
        
        // Düğüm tipi renkleri
        const colors: Record<string, {fill: string, stroke: string}> = {
          artist: {fill: '#EF4444', stroke: '#B91C1C'},
          genre: {fill: '#10B981', stroke: '#047857'},
          song: {fill: '#3B82F6', stroke: '#1D4ED8'},
          mood: {fill: '#8B5CF6', stroke: '#6D28D9'}
        };
        
        const nodeColor = colors[child.type] || {fill: '#9CA3AF', stroke: '#6B7280'};
        
        // Düğümü çiz
        g.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 25)
          .attr('fill', nodeColor.fill)
          .attr('stroke', nodeColor.stroke)
          .attr('stroke-width', 2)
          .attr('cursor', 'pointer')
          .on('click', () => handleNodeClick(child));
        
        // Düğüm metnini ekle
        g.append('text')
          .attr('x', x)
          .attr('y', y)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.3em')
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text(truncateText(child.name, 10));
        
        // Merkez ile çocuk arasında çizgi çiz
        g.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', x)
          .attr('y2', y)
          .attr('stroke', '#ddd')
          .attr('stroke-width', 1);
        
        // Alt düğümleri çiz (Eğer varsa)
        if (child.children && child.children.length > 0) {
          const grandchildren = child.children.slice(0, 4); // En fazla 4 alt düğüm göster
          const grandchildAngleStep = Math.PI / 4;
          
          grandchildren.forEach((grandchild, j) => {
            const spreadAngle = grandchildAngleStep * (j - (grandchildren.length - 1) / 2);
            const grandchildAngle = angle + spreadAngle;
            const gx = Math.cos(grandchildAngle) * 250;
            const gy = Math.sin(grandchildAngle) * 250;
            
            const grandchildColor = colors[grandchild.type] || {fill: '#9CA3AF', stroke: '#6B7280'};
            
            // Alt düğümü çiz
            g.append('circle')
              .attr('cx', gx)
              .attr('cy', gy)
              .attr('r', 15)
              .attr('fill', grandchildColor.fill)
              .attr('stroke', grandchildColor.stroke)
              .attr('stroke-width', 1.5)
              .attr('cursor', 'pointer')
              .on('click', () => handleNodeClick(grandchild));
            
            // Alt düğüm metnini ekle
            g.append('text')
              .attr('x', gx)
              .attr('y', gy)
              .attr('text-anchor', 'middle')
              .attr('dy', '0.3em')
              .attr('fill', 'white')
              .attr('font-size', '8px')
              .text(truncateText(grandchild.name, 8));
            
            // Çocuk ile alt düğüm arasında çizgi çiz
            g.append('line')
              .attr('x1', x)
              .attr('y1', y)
              .attr('x2', gx)
              .attr('y2', gy)
              .attr('stroke', '#ddd')
              .attr('stroke-width', 0.5)
              .attr('stroke-dasharray', '3,3');
          });
        }
      });
    }
  };
  
  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  const handleNodeClick = (node: MusicMapNode) => {
    console.log('Düğüme tıklandı:', node);
    // Burada düğüm tıklama işlemlerini gerçekleştirebilirsiniz
    // Örneğin, şarkı çalma, sanatçı bilgilerini gösterme vb.
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Müzik keşif haritanız hazırlanıyor...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-800">
        <p className="font-medium">Hata</p>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!mapData) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800">
        <p className="font-medium">Henüz yeterli veri yok</p>
        <p>Müzik keşif haritanızı oluşturmak için daha fazla müzik dinleyin ve etkileşimde bulunun.</p>
      </div>
    );
  }
  
  return (
    <div className="music-discovery-map bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Müzik Keşif Haritanız</h2>
      <p className="text-gray-600 mb-6">Dinleme alışkanlıklarınız ve tercihlerinize göre oluşturulan interaktif müzik haritası. Düğümlere tıklayarak keşfedin!</p>
      
      <div className="map-container overflow-auto">
        <svg ref={svgRef} className="mx-auto"></svg>
      </div>
      
      <div className="mt-6 grid grid-cols-4 gap-2">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#6366F1] mr-2"></div>
          <span className="text-sm">Sen</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#EF4444] mr-2"></div>
          <span className="text-sm">Sanatçılar</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#10B981] mr-2"></div>
          <span className="text-sm">Türler</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#3B82F6] mr-2"></div>
          <span className="text-sm">Şarkılar</span>
        </div>
      </div>
    </div>
  );
};

export default MusicDiscoveryMap;
