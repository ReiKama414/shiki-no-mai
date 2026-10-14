import lettering from './title-lettering.json'

// Letterforms follow the supplied book-cover reference and the official title
// artwork. Paths allow the title's ink and petal accents to follow the seasons.
export default function TitleMark() {
  return (
    <h1 className="title" lang="ja">
      <span className="sr-only">春夏秋冬代行者</span>
      <svg viewBox="0 0 1530 200" aria-hidden="true">
        {lettering.map((letter, index) => (
          <g key={index} transform={`translate(${index * 220}, 0)`}>
            <path d={letter.ink} fill="currentColor" fillRule="evenodd" />
            <path d={letter.petal} className="title-petal" fillRule="evenodd" />
          </g>
        ))}
      </svg>
    </h1>
  )
}
